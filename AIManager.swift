import Foundation
import Firebase
import CoreLocation
import FirebaseVertexAI

class AIManager {
    static let shared = AIManager()
    private var model: GenerativeModel

    private init() {
        model = VertexAI.vertexAI().generativeModel(modelName: "gemini-pro")
    }

    func getTravelSuggestions(for location: CLLocation, nearbyStops: [String], completion: @escaping (String?, Error?) -> Void) {
        let stopList = nearbyStops.joined(separator: ", ")
        let prompt = "You are a friendly travel assistant. A user is at [\(location.coordinate.latitude), \(location.coordinate.longitude)]. The following interesting places are nearby: \(stopList). Tell them what they could do at these places. Provide a single paragraph of suggestions."

        model.generateContent(prompt) { (result, error) in
            if let error = error {
                completion(nil, error)
            } else if let text = result?.text {
                completion(text, nil)
            } else {
                completion("Could not generate suggestions.", nil)
            }
        }
    }

    func getTravelSuggestions(for destination: String, completion: @escaping (String?, Error?) -> Void) {
        let prompt = "You are a friendly travel assistant. A user wants to go to \(destination). Provide a single paragraph of suggestions for what they could do there."

        model.generateContent(prompt) { (result, error) in
            if let error = error {
                completion(nil, error)
            } else if let text = result?.text {
                completion(text, nil)
            } else {
                completion("Could not generate suggestions.", nil)
            }
        }
    }
}
