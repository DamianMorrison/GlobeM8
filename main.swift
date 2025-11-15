import Foundation

// Main menu loop
while true {
    print("\n--- Main Menu ---")
    print("1. Create Trip")
    print("2. Create Stop")
    print("3. Create Visit")
    print("4. Create Flight")
    print("5. Create Hotel")
    print("6. Create Reservation")
    print("7. View My Trips")
    print("8. View Stops for a Trip")
    print("9. View Visits for a Stop")
    print("10. View Flights for a Trip")
    print("11. View Hotels for a Trip")
    print("12. View Reservations for a Trip")
    print("13. Update Trip")
    print("14. Update Stop")
    print("15. Update Visit")
    print("16. Update Flight")
    print("17. Update Hotel")
    print("18. Update Reservation")
    print("19. Delete Trip")
    print("20. Delete Stop")
    print("21. Delete Visit")
    print("22. Delete Flight")
    print("23. Delete Hotel")
    print("24. Delete Reservation")
    print("25. Get Travel Suggestions")
    print("0. Exit")
    print("Enter your choice: ", terminator: "")

    if let choice = readLine() {
        switch choice {
            case "1":
                createTrip()
            case "2":
                createStop()
            case "3":
                createVisit()
            case "4":
                createFlight()
            case "5":
                createHotel()
            case "6":
                createReservation()
            case "7":
                viewMyTrips()
            case "8":
                viewStopsForTrip()
            case "9":
                viewVisitsForStop()
            case "10":
                viewFlightsForTrip()
            case "11":
                viewHotelsForTrip()
            case "12":
                viewReservationsForTrip()
            case "13":
                updateTrip()
            case "14":
                updateStop()
            case "15":
                updateVisit()
            case "16":
                updateFlight()
            case "17":
                updateHotel()
            case "18":
                updateReservation()
            case "19":
                deleteTrip()
            case "20":
                deleteStop()
            case "21":
                deleteVisit()
            case "22":
                deleteFlight()
            case "23":
                deleteHotel()
            case "24":
                deleteReservation()
            case "25":
                getTravelSuggestions()
            case "0":
                exit(0)
            default:
                print("Invalid choice. Please try again.")
        }
    }
}

// Function stubs
func createTrip() { print("Function not implemented yet.") }
func createStop() { print("Function not implemented yet.") }
func createVisit() { print("Function not implemented yet.") }
func createFlight() { print("Function not implemented yet.") }
func createHotel() { print("Function not implemented yet.") }
func createReservation() { print("Function not implemented yet.") }
func viewMyTrips() { print("Function not implemented yet.") }
func viewStopsForTrip() { print("Function not implemented yet.") }
func viewVisitsForStop() { print("Function not implemented yet.") }
func viewFlightsForTrip() { print("Function not implemented yet.") }
func viewHotelsForTrip() { print("Function not implemented yet.") }
func viewReservationsForTrip() { print("Function not implemented yet.") }
func updateTrip() { print("Function not implemented yet.") }
func updateStop() { print("Function not implemented yet.") }
func updateVisit() { print("Function not implemented yet.") }
func updateFlight() { print("Function not implemented yet.") }
func updateHotel() { print("Function not implemented yet.") }
func updateReservation() { print("Function not implemented yet.") }
func deleteTrip() { print("Function not implemented yet.") }
func deleteStop() { print("Function not implemented yet.") }
func deleteVisit() { print("Function not implemented yet.") }
func deleteFlight() { print("Function not implemented yet.") }
func deleteHotel() { print("Function not implemented yet.") }
func deleteReservation() { print("Function not implemented yet.") }
func getTravelSuggestions() { print("Function not implemented yet.") }
