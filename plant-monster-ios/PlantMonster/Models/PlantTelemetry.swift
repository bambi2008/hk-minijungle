import Foundation

struct PlantTelemetry: Equatable, Sendable {
    var temperatureCelsius: Double
    var airHumidityPercent: Double
    var lightLux: Double
    var isTouched: Bool
    var isMoving: Bool
    var receivedAt: Date

    static let sample = PlantTelemetry(
        temperatureCelsius: 22,
        airHumidityPercent: 56,
        lightLux: 86,
        isTouched: false,
        isMoving: false,
        receivedAt: .now
    )
}

enum TelemetryPacketDecoder {
    /// Provisional firmware contract:
    /// {"t":22.0,"rh":56,"lux":320,"touch":true,"moving":false,"expr":"T02"}
    /// Confirm field names and units with the ESP32-C3 firmware team before release.
    static func decode(_ data: Data) throws -> (telemetry: PlantTelemetry, expression: PlantExpression?) {
        let packet = try JSONDecoder().decode(Packet.self, from: data)
        return (
            PlantTelemetry(
                temperatureCelsius: packet.temperature,
                airHumidityPercent: packet.airHumidity,
                lightLux: packet.light,
                isTouched: packet.touch ?? false,
                isMoving: packet.moving ?? false,
                receivedAt: .now
            ),
            packet.expression.flatMap(PlantExpression.init(firmwareCode:))
        )
    }

    private struct Packet: Decodable {
        let temperature: Double
        let airHumidity: Double
        let light: Double
        let touch: Bool?
        let moving: Bool?
        let expression: String?

        enum CodingKeys: String, CodingKey {
            case temperature = "t"
            case airHumidity = "rh"
            case light = "lux"
            case touch
            case moving
            case expression = "expr"
        }
    }
}

