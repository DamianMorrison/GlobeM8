import Foundation

struct Trip: Codable {
    var id: String? // Assuming the ID is assigned by the server
    var name: String
    var description: String?
    var startDate: Date?
    var endDate: Date?
    var budget: Double?
    var ownerId: String // ID of the user who owns the trip
    var sharedWith: [String] // IDs of users with whom the trip is shared
}

struct Stop: Codable {
    var id: String?
    var tripId: String
    var name: String
    var description: String?
    var latitude: Double?
    var longitude: Double?
    var order: Int?
}

struct Visit: Codable {
    var id: String?
    var stopId: String
    var name: String
    var description: String?
    var visitDate: Date?
    var rating: Int?
}

struct Flight: Codable {
    var id: String?
    var tripId: String
    var flightNumber: String
    var airline: String
    var departureAirport: String
    var arrivalAirport: String
    var departureTime: Date
    var arrivalTime: Date
    var confirmationNumber: String?
}

struct Hotel: Codable {
    var id: String?
    var tripId: String
    var name: String
    var address: String?
    var checkInDate: Date
    var checkOutDate: Date
    var confirmationNumber: String?
}

struct Reservation: Codable {
    var id: String?
    var tripId: String
    var name: String
    var type: String // e.g., "Restaurant", "Tour", "Car Rental"
    var details: String?
    var reservationTime: Date
    var confirmationNumber: String?
}