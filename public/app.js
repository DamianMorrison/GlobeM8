document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();

    // --- Main Layout ---
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmail = document.getElementById('user-email');
    const tripManagement = document.getElementById('trip-management');
    const tripDetailContainer = document.getElementById('trip-detail-container');

    // --- AI Suggestions ---
    const getSuggestionsBtn = document.getElementById('get-suggestions-btn');
    const promptInput = document.getElementById('prompt-input');
    const suggestionsOutput = document.getElementById('suggestions-output');

    // --- Trip List ---
    const createTripForm = document.getElementById('create-trip-form');
    const tripNameInput = document.getElementById('trip-name');
    const tripDescriptionInput = document.getElementById('trip-description');
    const tripStartDateInput = document.getElementById('trip-start-date');
    const tripEndDateInput = document.getElementById('trip-end-date');
    const tripBudgetInput = document.getElementById('trip-budget');
    const tripList = document.getElementById('trip-list');

    // --- Trip Details ---
    const tripDetailName = document.getElementById('trip-detail-name');
    const backToTripsBtn = document.getElementById('back-to-trips');
    
    const addStopForm = document.getElementById('add-stop-form');
    const stopNameInput = document.getElementById('stop-name');
    const stopList = document.getElementById('stop-list');

    const addFlightForm = document.getElementById('add-flight-form');
    const flightDetailsInput = document.getElementById('flight-details');
    const flightList = document.getElementById('flight-list');

    const addHotelForm = document.getElementById('add-hotel-form');
    const hotelNameInput = document.getElementById('hotel-name');
    const hotelList = document.getElementById('hotel-list');

    const addReservationForm = document.getElementById('add-reservation-form');
    const reservationDetailsInput = document.getElementById('reservation-details');
    const reservationList = document.getElementById('reservation-list');

    // --- State Variables ---
    let currentUser = null;
    let currentTripId = null;

    // --- API Communication ---
    const API_BASE_URL = '/api'; // Using the rewrite in firebase.json

    async function callApi(endpoint, options = {}) {
        if (!currentUser) {
            throw new Error("User not authenticated");
        }

        const idToken = await currentUser.getIdToken(true);
        const headers = {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        };

        const config = {
            ...options,
            headers,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API call failed');
        }

        return response.json();
    }

    // --- Authentication ---
    const provider = new firebase.auth.GoogleAuthProvider();
    loginBtn.onclick = () => auth.signInWithPopup(provider);
    logoutBtn.onclick = () => auth.signOut();

    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            userEmail.textContent = user.email;
            userEmail.style.display = 'block';
            tripManagement.style.display = 'block';
            showTripList();
        } else {
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            userEmail.style.display = 'none';
            tripManagement.style.display = 'none';
            tripDetailContainer.style.display = 'none';
        }
    });

    // --- AI Suggestions ---
    getSuggestionsBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            suggestionsOutput.textContent = 'Please enter a prompt.';
            return;
        }

        suggestionsOutput.textContent = 'Getting AI suggestions...';
        try {
            const response = await callApi('/getTravelSuggestions', {
                method: 'POST',
                body: JSON.stringify({ prompt })
            });
            suggestionsOutput.textContent = response.result;
        } catch (error) {
            console.error('Error calling getTravelSuggestions function:', error);
            suggestionsOutput.textContent = 'Failed to get suggestions. ' + error.message;
        }
    });

    // --- Trip List View ---
    async function showTripList() {
        tripDetailContainer.style.display = 'none';
        tripManagement.style.display = 'block';
        currentTripId = null;

        try {
            const trips = await callApi('/getTrips');
            tripList.innerHTML = '';
            trips.forEach(trip => {
                const li = document.createElement('li');
                li.textContent = trip.name;
                li.onclick = () => showTripDetail(trip.id, trip.name);
                tripList.appendChild(li);
            });
        } catch (error) {
            console.error("Error getting trips:", error);
        }
    }

    createTripForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = tripNameInput.value.trim();
        const description = tripDescriptionInput.value.trim();
        const startDate = tripStartDateInput.value;
        const endDate = tripEndDateInput.value;
        const budget = tripBudgetInput.value;

        if (name && currentUser) {
            try {
                await callApi('/createTrip', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        name, 
                        description, 
                        startDate, 
                        endDate, 
                        budget: Number(budget) 
                    })
                });
                tripNameInput.value = '';
                tripDescriptionInput.value = '';
                tripStartDateInput.value = '';
                tripEndDateInput.value = '';
                tripBudgetInput.value = '';
                showTripList();
            } catch (error) {
                console.error('Error creating trip:', error);
            }
        }
    });

    // --- Trip Detail View ---
    async function showTripDetail(tripId, tripName) {
        tripManagement.style.display = 'none';
        tripDetailContainer.style.display = 'block';
        currentTripId = tripId;
        tripDetailName.textContent = tripName;

        // Clear existing lists
        stopList.innerHTML = '';
        flightList.innerHTML = '';
        hotelList.innerHTML = '';
        reservationList.innerHTML = '';

        try {
            const [stops, flights, hotels, reservations] = await Promise.all([
                callApi(`/trips/${tripId}/stops`),
                callApi(`/trips/${tripId}/flights`),
                callApi(`/trips/${tripId}/hotels`),
                callApi(`/trips/${tripId}/reservations`)
            ]);

            stops.forEach(stop => {
                const li = document.createElement('li');
                li.textContent = stop.name;
                stopList.appendChild(li);
            });

            flights.forEach(flight => {
                const li = document.createElement('li');
                li.textContent = flight.details;
                flightList.appendChild(li);
            });

            hotels.forEach(hotel => {
                const li = document.createElement('li');
                li.textContent = hotel.name;
                hotelList.appendChild(li);
            });

            reservations.forEach(reservation => {
                const li = document.createElement('li');
                li.textContent = reservation.details;
                reservationList.appendChild(li);
            });

        } catch (error) {
            console.error("Error getting trip details:", error);
        }
    }

    addStopForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = stopNameInput.value.trim();
        if (name && currentTripId) {
            try {
                await callApi(`/trips/${currentTripId}/stops`, {
                    method: 'POST',
                    body: JSON.stringify({ name })
                });
                stopNameInput.value = '';
                showTripDetail(currentTripId, tripDetailName.textContent);
            } catch (error) {
                console.error('Error creating stop:', error);
            }
        }
    });

    addFlightForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const details = flightDetailsInput.value.trim();
        if (details && currentTripId) {
            try {
                await callApi(`/trips/${currentTripId}/flights`, {
                    method: 'POST',
                    body: JSON.stringify({ details })
                });
                flightDetailsInput.value = '';
                showTripDetail(currentTripId, tripDetailName.textContent);
            } catch (error) {
                console.error('Error creating flight:', error);
            }
        }
    });

    addHotelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = hotelNameInput.value.trim();
        if (name && currentTripId) {
            try {
                await callApi(`/trips/${currentTripId}/hotels`, {
                    method: 'POST',
                    body: JSON.stringify({ name })
                });
                hotelNameInput.value = '';
                showTripDetail(currentTripId, tripDetailName.textContent);
            } catch (error) {
                console.error('Error creating hotel:', error);
            }
        }
    });

    addReservationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const details = reservationDetailsInput.value.trim();
        if (details && currentTripId) {
            try {
                await callApi(`/trips/${currentTripId}/reservations`, {
                    method: 'POST',
                    body: JSON.stringify({ details })
                });
                reservationDetailsInput.value = '';
                showTripDetail(currentTripId, tripDetailName.textContent);
            } catch (error) {
                console.error('Error creating reservation:', error);
            }
        }
    });

    backToTripsBtn.onclick = showTripList;
});