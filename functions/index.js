require('dotenv').config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Safely initialize the Gemini AI SDK
let genAI;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (geminiApiKey) {
    genAI = new GoogleGenerativeAI(geminiApiKey);
} else {
    console.warn('Gemini API key not found. AI features will be disabled.');
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Middleware for authentication
const authenticate = async (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(403).send('Unauthorized');
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;
        next();
    } catch (error) {
        console.error('Error while verifying Firebase ID token:', error);
        res.status(403).send('Unauthorized');
    }
};

async function isTripMember(tripId, userId) {
    const trip = await admin.firestore().collection('trips').doc(tripId).get();
    if (!trip.exists) return false;
    const tripData = trip.data();
    return tripData.ownerId === userId || (tripData.sharedWith && tripData.sharedWith.includes(userId));
}

// All routes will be authenticated
app.use(authenticate);

app.post('/getTravelSuggestions', async (req, res) => {
    // Check if genAI is initialized
    if (!genAI) {
        return res.status(500).json({ error: "Gemini API key not configured. AI features are disabled." });
    }

    const prompt = req.body.prompt;
    if (!prompt) {
        return res.status(400).json({ error: "The function must be called with a 'prompt' argument." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return res.json({ result: text });
    } catch (error) {
        console.error("Error calling Gemini AI:", error);
        return res.status(500).json({ error: "An error occurred while calling the AI model." });
    }
});

app.post('/createTrip', async (req, res) => {
    const { name, description, startDate, endDate, budget } = req.body;
    const ownerId = req.user.uid;

    try {
        const tripRef = await admin.firestore().collection('trips').add({
            name,
            description,
            startDate,
            endDate,
            budget,
            ownerId,
            sharedWith: [],
        });
        return res.json({ id: tripRef.id });
    } catch (error) {
        console.error("Error creating trip:", error);
        return res.status(500).json({ error: 'An error occurred while creating the trip.' });
    }
});

app.get('/getTrips', async (req, res) => {
    const uid = req.user.uid;
    const trips = [];

    try {
        const ownedTripsSnapshot = await admin.firestore().collection('trips').where('ownerId', '==', uid).get();
        ownedTripsSnapshot.forEach(doc => {
            trips.push({ id: doc.id, ...doc.data() });
        });

        const sharedTripsSnapshot = await admin.firestore().collection('trips').where('sharedWith', 'array-contains', uid).get();
        sharedTripsSnapshot.forEach(doc => {
            // Avoid duplicates if a user is both owner and shared
            if (!trips.some(trip => trip.id === doc.id)) {
                trips.push({ id: doc.id, ...doc.data() });
            }
        });

        return res.json(trips);
    } catch (error) {
        console.error("Error getting trips:", error);
        return res.status(500).json({ error: 'An error occurred while getting the trips.' });
    }
});

app.put('/updateTrip/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, startDate, endDate, budget } = req.body;
    const uid = req.user.uid;

    try {
        const tripRef = admin.firestore().collection('trips').doc(id);
        const trip = await tripRef.get();

        if (!trip.exists || trip.data().ownerId !== uid) {
            return res.status(403).json({ error: 'You do not have permission to update this trip.' });
        }

        await tripRef.update({ name, description, startDate, endDate, budget });
        return res.json({ id: tripRef.id });
    } catch (error) {
        console.error("Error updating trip:", error);
        return res.status(500).json({ error: 'An error occurred while updating the trip.' });
    }
});

app.delete('/deleteTrip/:id', async (req, res) => {
    const { id } = req.params;
    const uid = req.user.uid;

    try {
        const tripRef = admin.firestore().collection('trips').doc(id);
        const trip = await tripRef.get();

        if (!trip.exists || trip.data().ownerId !== uid) {
            return res.status(403).json({ error: 'You do not have permission to delete this trip.' });
        }

        await tripRef.delete();
        return res.json({ id: tripRef.id });
    } catch (error) {
        console.error("Error deleting trip:", error);
        return res.status(500).json({ error: 'An error occurred while deleting the trip.' });
    }
});

// Generic function to add an item to a subcollection
const addItemToTrip = (collectionName) => async (req, res) => {
    const { tripId } = req.params;
    const data = req.body;

    if (!(await isTripMember(tripId, req.user.uid))) {
        return res.status(403).json({ error: `You do not have permission to add to this trip.` });
    }

    try {
        const itemRef = await admin.firestore().collection('trips').doc(tripId).collection(collectionName).add(data);
        return res.json({ id: itemRef.id });
    } catch (error) {
        console.error(`Error creating ${collectionName}:`, error);
        return res.status(500).json({ error: `An error occurred while creating the ${collectionName}.` });
    }
};

// Generic function to get items from a subcollection
const getItemsFromTrip = (collectionName) => async (req, res) => {
    const { tripId } = req.params;

    if (!(await isTripMember(tripId, req.user.uid))) {
        return res.status(403).json({ error: `You do not have permission to view this trip\'s ${collectionName}.` });
    }

    try {
        const snapshot = await admin.firestore().collection('trips').doc(tripId).collection(collectionName).get();
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return res.json(items);
    } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        return res.status(500).json({ error: `An error occurred while getting the ${collectionName}.` });
    }
};

// Stops
app.post('/trips/:tripId/stops', addItemToTrip('stops'));
app.get('/trips/:tripId/stops', getItemsFromTrip('stops'));

// Flights
app.post('/trips/:tripId/flights', addItemToTrip('flights'));
app.get('/trips/:tripId/flights', getItemsFromTrip('flights'));

// Hotels
app.post('/trips/:tripId/hotels', addItemToTrip('hotels'));
app.get('/trips/:tripId/hotels', getItemsFromTrip('hotels'));

// Reservations
app.post('/trips/:tripId/reservations', addItemToTrip('reservations'));
app.get('/trips/:tripId/reservations', getItemsFromTrip('reservations'));

// Export the express app as a single Cloud Function
exports.api = functions.https.onRequest(app);