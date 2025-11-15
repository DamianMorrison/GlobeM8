import Foundation

class APIService {
    static let shared = APIService()
    private let baseURL = "https://your-backend-api-url.com/api" // Replace with your actual backend URL

    // User Authentication
    struct User: Codable {
        let id: String
        let email: String
    }

    private var currentUser: User?

    func setCurrentUser(user: User) {
        self.currentUser = user
    }

    // Generic request function
    private func makeRequest<T: Codable>(endpoint: String, method: String, body: T? = nil, completion: @escaping (Result<T, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/\(endpoint)") else {
            completion(.failure(NSError(domain: "InvalidURL", code: -1, userInfo: nil)))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        if let currentUser = currentUser {
            request.addValue("Bearer \(currentUser.id)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            do {
                request.httpBody = try JSONEncoder().encode(body)
            } catch {
                completion(.failure(error))
                return
            }
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NSError(domain: "NoData", code: -1, userInfo: nil)))
                return
            }

            do {
                let decodedResponse = try JSONDecoder().decode(T.self, from: data)
                completion(.success(decodedResponse))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // MARK: - Trip Functions
    func createTrip(trip: Trip, completion: @escaping (Result<Trip, Error>) -> Void) {
        // To be implemented
    }

    func getTrips(completion: @escaping (Result<[Trip], Error>) -> Void) {
        // To be implemented
    }

    func updateTrip(trip: Trip, completion: @escaping (Result<Trip, Error>) -> Void) {
        // To be implemented
    }

    func deleteTrip(tripId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        // To be implemented
    }

    // MARK: - Stop Functions
    func createStop(stop: Stop, completion: @escaping (Result<Stop, Error>) -> Void) {
        // To be implemented
    }

    func getStops(forTripId tripId: String, completion: @escaping (Result<[Stop], Error>) -> Void) {
        // To be implemented
    }

    func updateStop(stop: Stop, completion: @escaping (Result<Stop, Error>) -> Void) {
        // To be implemented
    }

    func deleteStop(stopId: String, forTripId tripId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        // To be implemented
    }

    // MARK: - Visit Functions
    func createVisit(visit: Visit, completion: @escaping (Result<Visit, Error>) -> Void) {
        // To be implemented
    }

    func getVisits(forStopId stopId: String, completion: @escaping (Result<[Visit], Error>) -> Void) {
        // To be implemented
    }

    func updateVisit(visit: Visit, completion: @escaping (Result<Visit, Error>) -> Void) {
        // To be implemented
    }

    func deleteVisit(visitId: String, forStopId stopId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        // To be implemented
    }

    // MARK: - Flight Functions
    func createFlight(flight: Flight, completion: @escaping (Result<Flight, Error>) -> Void) {
        // To be implemented
    }

    func getFlights(forTripId tripId: String, completion: @escaping (Result<[Flight], Error>) -> Void) {
        // To be implemented
    }

    func updateFlight(flight: Flight, completion: @escaping (Result<Flight, Error>) -> Void) {
        // To be implemented
    }

    func deleteFlight(flightId: String, forTripId tripId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        // To be implemented
    }

    // MARK: - Hotel Functions
    func createHotel(hotel: Hotel, completion: @escaping (Result<Hotel, Error>) -> Void) {
        // To be implemented
    }

    func getHotels(forTripId tripId: String, completion: @escaping (Result<[Hotel], Error>) -> Void) {
        // To be implemented
    }

    func updateHotel(hotel: Hotel, completion: @escaping (Result<Hotel, Error>) -> Void) {
        // To be implemented
    }

    func deleteHotel(hotelId: String, forTripId tripId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        // To be implemented
    }

    // MARK: - Reservation Functions
    func createReservation(reservation: Reservation, completion: @escaping (Result<Reservation, Error>) -> Void) {
        // To be implemented
    }

    func getReservations(forTripId tripId: String, completion: @escaping (Result<[Reservation], Error>) -> Void) {
        // To be implemented
    }

    func updateReservation(reservation: Reservation, completion: @escaping (Result<Reservation, Error>) -> Void) {
        // To be implemented
    }

    func deleteReservation(reservationId: String, forTripId tripId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        // To be implemented
    }

    // MARK: - AI Functions
    func getTravelSuggestions(prompt: String, completion: @escaping (Result<String, Error>) -> Void) {
        // To be implemented
    }
}