const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
admin.initializeApp();

const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

async function isTripMember(tripId, userId) {
    const trip = await admin.firestore().collection('trips').doc(tripId).get();
    if (!trip.exists) return false;
    const tripData = trip.data();
    return tripData.ownerId === userId || (tripData.sharedWith && tripData.sharedWith.includes(userId));
}

exports.getTravelSuggestions = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const prompt = data.prompt;
    if (!prompt) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'prompt' argument.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return { result: text };
    } catch (error) {
        console.error("Error calling Gemini AI:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while calling the AI model.");
    }
});

exports.createTrip = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to create a trip.');
    }

    const { name, description, startDate, endDate, budget } = data;
    const ownerId = context.auth.uid;

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
        return { id: tripRef.id };
    } catch (error) {
        console.error("Error creating trip:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while creating the trip.');
    }
});

exports.getTrips = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to view trips.');
    }

    const uid = context.auth.uid;
    const trips = [];

    try {
        const ownedTripsSnapshot = await admin.firestore().collection('trips').where('ownerId', '==', uid).get();
        ownedTripsSnapshot.forEach(doc => {
            trips.push({ id: doc.id, ...doc.data() });
        });

        const sharedTripsSnapshot = await admin.firestore().collection('trips').where('sharedWith', 'array-contains', uid).get();
        sharedTripsSnapshot.forEach(doc => {
            trips.push({ id: doc.id, ...doc.data() });
        });

        return trips;
    } catch (error) {
        console.error("Error getting trips:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while getting the trips.');
    }
});

exports.updateTrip = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to update a trip.');
    }

    const { id, name, description, startDate, endDate, budget } = data;
    const uid = context.auth.uid;

    try {
        const tripRef = admin.firestore().collection('trips').doc(id);
        const trip = await tripRef.get();

        if (!trip.exists || trip.data().ownerId !== uid) {
            throw new functions.https.HttpsError('permission-denied', 'You do not have permission to update this trip.');
        }

        await tripRef.update({ name, description, startDate, endDate, budget });
        return { id: tripRef.id };
    } catch (error) {
        console.error("Error updating trip:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while updating the trip.');
    }
});

exports.deleteTrip = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to delete a trip.');
    }

    const { id } = data;
    const uid = context.auth.uid;

    try {
        const tripRef = admin.firestore().collection('trips').doc(id);
        const trip = await tripRef.get();

        if (!trip.exists || trip.data().ownerId !== uid) {
            throw new functions.https.HttpsError('permission-denied', 'You do not have permission to delete this trip.');
        }

        await tripRef.delete();
        return { id: tripRef.id };
    } catch (error) {
        console.error("Error deleting trip:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while deleting the trip.');
    }
});

exports.createStop = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to create a stop.');
    }

    const { tripId, name } = data;

    if (!(await isTripMember(tripId, context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to add a stop to this trip.');
    }

    try {
        const stopRef = await admin.firestore().collection('trips').doc(tripId).collection('stops').add({ name });
        return { id: stopRef.id };
    } catch (error) {
        console.error("Error creating stop:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while creating the stop.');
    }
});

exports.getStops = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to view stops.');
    }

    const { tripId } = data;

    if (!(await isTripMember(tripId, context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to view this trip\'s stops.');
    }

    try {
        const stopsSnapshot = await admin.firestore().collection('trips').doc(tripId).collection('stops').get();
        const stops = [];
        stopsSnapshot.forEach(doc => {
            stops.push({ id: doc.id, ...doc.data() });
        });
        return stops;
    } catch (error) {
        console.error("Error getting stops:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while getting the stops.');
    }
});

exports.createFlight = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to create a flight.');
    }

    const { tripId, details } = data;

    if (!(await isTripMember(tripId, context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to add a flight to this trip.');
    }

    try {
        const flightRef = await admin.firestore().collection('trips').doc(tripId).collection('flights').add({ details });
        return { id: flightRef.id };
    } catch (error) {
        console.error("Error creating flight:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while creating the flight.');
    }
});

exports.getFlights = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to view flights.');
    }

    const { tripId } = data;

    if (!(await isTripMember(tripId, context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to view this trip\'s flights.');
    }

    try {
        const flightsSnapshot = await admin.firestore().collection('trips').doc(tripId).collection('flights').get();
        const flights = [];
        flightsSnapshot.forEach(doc => {
            flights.push({ id: doc.id, ...doc.data() });
        });
        return flights;
    } catch (error) {
        console.error("Error getting flights:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while getting the flights.');
    }
});

exports.createHotel = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to create a hotel.');
    }

    const { tripId, name } = data;

    if (!(await isTripMember(tripId, context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to add a hotel to this trip.');
    }

    try {
        const hotelRef = await admin.firestore().collection('trips').doc(tripId).collection('hotels').add({ name });
        return { id: hotelRef.id };
    } catch (error) {
        console.error("Error creating hotel:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while creating the hotel.');
    }
});

exports.getHotels = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to view hotels.');
    }

    const { tripId } = data;

    if (!(await isTripMember(tripId, context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to view this trip\'s hotels.');
    }

    try {
        const hotelsSnapshot = await admin.firestore().collection('trips').doc(tripId).collection('hotels').get();
        const hotels = [];
        hotelsSnapshot.forEach(doc => {
            hotels.push({ id: doc.id, ...doc.data() });
        });
        return hotels;
    } catch (error) {
        console.error("Error getting hotels:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while getting the hotels.');
    }
});

exports.createReservation = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to create a reservation.');
    }

    const { tripId, details } = data;

    if (!(await isTripMember(tripId, context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to add a reservation to this trip.');
    }

    try {
        const reservationRef = await admin.firestore().collection('trips').doc(tripId).collection('reservations').add({ details });
        return { id: reservationRef.id };
    } catch (error) {
        console.error("Error creating reservation:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while creating the reservation.');
    }
});

exports.getReservations = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to view reservations.');
    }

    const { tripId } = data;

    if (!(await isTripMember(tripId, context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to view this trip\'s reservations.');
    }

    try {
        const reservationsSnapshot = await admin.firestore().collection('trips').doc(tripId).collection('reservations').get();
        const reservations = [];
        reservationsSnapshot.forEach(doc => {
            reservations.push({ id: doc.id, ...doc.data() });
        });
        return reservations;
    } catch (error) {
        console.error("Error getting reservations:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while getting the reservations.');
    }
});