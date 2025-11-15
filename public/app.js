document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const functions = firebase.functions();

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

    // --- Firebase Cloud Functions ---
    const getTravelSuggestions = functions.httpsCallable('getTravelSuggestions');
    const createTrip = functions.httpsCallable('createTrip');
    const getTrips = functions.httpsCallable('getTrips');
    const createStop = functions.httpsCallable('createStop');
    const getStops = functions.httpsCallable('getStops');
    const createFlight = functions.httpsCallable('createFlight');
    const getFlights = functions.httpsCallable('getFlights');
    const createHotel = functions.httpsCallable('createHotel');
    const getHotels = functions.httpsCallable('getHotels');
    const createReservation = functions.httpsCallable('createReservation');
    const getReservations = functions.httpsCallable('getReservations');

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
            const response = await getTravelSuggestions({ prompt: prompt });
            suggestionsOutput.textContent = response.data.result;
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
            const trips = await getTrips();
            tripList.innerHTML = '';
            trips.data.forEach(trip => {
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
                await createTrip({ 
                    name, 
                    description, 
                    startDate, 
                    endDate, 
                    budget: Number(budget) 
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
                getStops({ tripId }),
                getFlights({ tripId }),
                getHotels({ tripId }),
                getReservations({ tripId })
            ]);

            stops.data.forEach(stop => {
                const li = document.createElement('li');
                li.textContent = stop.name;
                stopList.appendChild(li);
            });

            flights.data.forEach(flight => {
                const li = document.createElement('li');
                li.textContent = flight.details;
                flightList.appendChild(li);
            });

            hotels.data.forEach(hotel => {
                const li = document.createElement('li');
                li.textContent = hotel.name;
                hotelList.appendChild(li);
            });

            reservations.data.forEach(reservation => {
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
                await createStop({ tripId: currentTripId, name });
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
                await createFlight({ tripId: currentTripId, details });
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
                await createHotel({ tripId: currentTripId, name });
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
                await createReservation({ tripId: currentTripId, details });
                reservationDetailsInput.value = '';
                showTripDetail(currentTripId, tripDetailName.textContent);
            } catch (error) {
                console.error('Error creating reservation:', error);
            }
        }
    });

    backToTripsBtn.onclick = showTripList;
});