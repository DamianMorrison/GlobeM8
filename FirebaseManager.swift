
import Foundation
import Firebase
import FirebaseFirestore
import FirebaseFirestoreSwift
import CoreLocation

class FirebaseManager {

    static let shared = FirebaseManager()
    let db = Firestore.firestore()

    private init() {}

    // MARK: - Create Methods

    func createTrip(userId: String, name: String, isPublic: Bool, completion: @escaping (String?, Error?) -> Void) {
        let trip = Trip(name: name, createdAt: Date(), isPublic: isPublic, userId: userId)
        do {
            let ref = try db.collection("trips").addDocument(from: trip) {
                error in
                completion(ref?.documentID, error)
            }
        } catch {
            completion(nil, error)
        }
    }

    func createStop(tripId: String, name: String, location: GeoPoint, order: Int, completion: @escaping (String?, Error?) -> Void) {
        let stop = Stop(name: name, location: location, order: order, tripId: tripId)
        do {
            let ref = try db.collection("stops").addDocument(from: stop) {
                error in
                completion(ref?.documentID, error)
            }
        } catch {
            completion(nil, error)
        }
    }
    
    func createVisit(stopId: String, userId: String, notes: String, completion: @escaping (String?, Error?) -> Void) {
        let visit = Visit(notes: notes, visitedAt: Date(), stopId: stopId, userId: userId)
        do {
            let ref = try db.collection("visits").addDocument(from: visit) {
                error in
                completion(ref?.documentID, error)
            }
        } catch {
            completion(nil, error)
        }
    }

    func createFlight(tripId: String, airline: String, flightNumber: String, departureAirport: String, arrivalAirport: String, departureTime: Date, arrivalTime: Date, completion: @escaping (String?, Error?) -> Void) {
        let flight = Flight(tripId: tripId, airline: airline, flightNumber: flightNumber, departureAirport: departureAirport, arrivalAirport: arrivalAirport, departureTime: departureTime, arrivalTime: arrivalTime)
        do {
            let ref = try db.collection("flights").addDocument(from: flight) {
                error in
                completion(ref?.documentID, error)
            }
        } catch {
            completion(nil, error)
        }
    }

    func createHotel(tripId: String, name: String, address: String, checkInTime: Date, checkOutTime: Date, completion: @escaping (String?, Error?) -> Void) {
        let hotel = Hotel(tripId: tripId, name: name, address: address, checkInTime: checkInTime, checkOutTime: checkOutTime)
        do {
            let ref = try db.collection("hotels").addDocument(from: hotel) {
                error in
                completion(ref?.documentID, error)
            }
        } catch {
            completion(nil, error)
        }
    }

    func createReservation(tripId: String, name: String, address: String, reservationTime: Date, notes: String, completion: @escaping (String?, Error?) -> Void) {
        let reservation = Reservation(tripId: tripId, name: name, address: address, reservationTime: reservationTime, notes: notes)
        do {
            let ref = try db.collection("reservations").addDocument(from: reservation) {
                error in
                completion(ref?.documentID, error)
            }
        } catch {
            completion(nil, error)
        }
    }

    // MARK: - Fetch Methods

    func fetchTrips(for userId: String, completion: @escaping ([Trip]?, Error?) -> Void) {
        db.collection("trips").whereField("userId", isEqualTo: userId)
            .getDocuments { (querySnapshot, err) in
                self.handleFetch(querySnapshot: querySnapshot, error: err, completion: completion)
        }
    }

    func fetchStops(for tripId: String, completion: @escaping ([Stop]?, Error?) -> Void) {
        db.collection("stops").whereField("tripId", isEqualTo: tripId)
            .order(by: "order")
            .getDocuments { (querySnapshot, err) in
                self.handleFetch(querySnapshot: querySnapshot, error: err, completion: completion)
        }
    }

    func fetchVisits(for stopId: String, userId: String, completion: @escaping ([Visit]?, Error?) -> Void) {
        db.collection("visits").whereField("stopId", isEqualTo: stopId)
            .whereField("userId", isEqualTo: userId)
            .getDocuments { (querySnapshot, err) in
                self.handleFetch(querySnapshot: querySnapshot, error: err, completion: completion)
        }
    }

    func fetchFlights(for tripId: String, completion: @escaping ([Flight]?, Error?) -> Void) {
        db.collection("flights").whereField("tripId", isEqualTo: tripId)
            .getDocuments { (querySnapshot, err) in
                self.handleFetch(querySnapshot: querySnapshot, error: err, completion: completion)
        }
    }

    func fetchHotels(for tripId: String, completion: @escaping ([Hotel]?, Error?) -> Void) {
        db.collection("hotels").whereField("tripId", isEqualTo: tripId)
            .getDocuments { (querySnapshot, err) in
                self.handleFetch(querySnapshot: querySnapshot, error: err, completion: completion)
        }
    }

    func fetchReservations(for tripId: String, completion: @escaping ([Reservation]?, Error?) -> Void) {
        db.collection("reservations").whereField("tripId", isEqualTo: tripId)
            .getDocuments { (querySnapshot, err) in
                self.handleFetch(querySnapshot: querySnapshot, error: err, completion: completion)
        }
    }

    // MARK: - Update Methods

    func updateDocument(docId: String, collection: String, data: [String: Any], completion: @escaping (Error?) -> Void) {
        db.collection(collection).document(docId).updateData(data, completion: completion)
    }

    // MARK: - Delete Methods

    func deleteTrip(tripId: String, completion: @escaping (Error?) -> Void) {
        let tripRef = db.collection("trips").document(tripId)

        db.collection("stops").whereField("tripId", isEqualTo: tripId).getDocuments { (stopSnapshot, error) in
            if let error = error {
                completion(error)
                return
            }

            let batch = self.db.batch()
            batch.deleteDocument(tripRef)

            guard let stopSnapshot = stopSnapshot else {
                batch.commit(completion: completion)
                return
            }

            let stopIds = stopSnapshot.documents.map { $0.documentID }
            for stopDocument in stopSnapshot.documents {
                batch.deleteDocument(stopDocument.reference)
            }

            if stopIds.isEmpty {
                batch.commit(completion: completion)
                return
            }

            // Note: Firestore 'in' queries are limited to 10 elements.
            // For production apps, you'll need a more robust solution, such as executing multiple queries.
            self.db.collection("visits").whereField("stopId", in: stopIds).getDocuments { (visitSnapshot, error) in
                if let error = error {
                    completion(error)
                    return
                }

                guard let visitSnapshot = visitSnapshot else {
                    batch.commit(completion: completion)
                    return
                }

                for visitDocument in visitSnapshot.documents {
                    batch.deleteDocument(visitDocument.reference)
                }

                batch.commit(completion: completion)
            }
        }
    }

    func deleteStop(stopId: String, completion: @escaping (Error?) -> Void) {
        let stopRef = db.collection("stops").document(stopId)

        db.collection("visits").whereField("stopId", isEqualTo: stopId).getDocuments { (visitSnapshot, error) in
            if let error = error {
                completion(error)
                return
            }

            let batch = self.db.batch()
            batch.deleteDocument(stopRef)

            guard let visitSnapshot = visitSnapshot else {
                batch.commit(completion: completion)
                return
            }

            for visitDocument in visitSnapshot.documents {
                batch.deleteDocument(visitDocument.reference)
            }

            batch.commit(completion: completion)
        }
    }

    func deleteDocument(docId: String, collection: String, completion: @escaping (Error?) -> Void) {
        db.collection(collection).document(docId).delete(completion: completion)
    }

    // MARK: - Private Helper Methods

    private func handleFetch<T: Decodable>(querySnapshot: QuerySnapshot?, error: Error?, completion: @escaping ([T]?, Error?) -> Void) {
        if let error = error {
            print("Error getting documents: \(error)")
            completion(nil, error)
            return
        }

        guard let querySnapshot = querySnapshot else {
            completion([], nil)
            return
        }

        let results = querySnapshot.documents.compactMap { document -> T? in
            do {
                return try document.data(as: T.self)
            } catch {
                print("Error decoding document: \(error)")
                return nil
            }
        }

        completion(results, nil)
    }
}
