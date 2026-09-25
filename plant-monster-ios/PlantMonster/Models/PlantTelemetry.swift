import Foundation

struct PlantTelemetry: Equatable, Sendable {
    var temperatureCelsius: Double
    var airHumidityPercent: Double
    var substrateMoisturePercent: Double?
    var lightLux: Double
    var isTouched: Bool
    var isMoving: Bool
    var receivedAt: Date

    static let sample = PlantTelemetry(
        temperatureCelsius: 22,
        airHumidityPercent: 56,
        substrateMoisturePercent: 43,
        lightLux: 86,
        isTouched: false,
        isMoving: false,
        receivedAt: .now
    )
}

enum TelemetryPacketDecoder {
    static func decode(_ data: Data) throws -> PlantMonsterTelemetryUpdate {
        if data.first == PlantMonsterWireProtocol.magic {
            return try PlantMonsterWireProtocol.decodeTelemetry(data)
        }

        return try decodeLegacyJSON(data)
    }

    /// Temporary migration support for the original JSON prototype.
    private static func decodeLegacyJSON(_ data: Data) throws -> PlantMonsterTelemetryUpdate {
        let packet = try JSONDecoder().decode(Packet.self, from: data)
        return PlantMonsterTelemetryUpdate(
            telemetry: PlantTelemetry(
                temperatureCelsius: packet.temperature,
                airHumidityPercent: packet.airHumidity,
                substrateMoisturePercent: packet.substrateMoisture,
                lightLux: packet.light,
                isTouched: packet.touch ?? false,
                isMoving: packet.moving ?? false,
                receivedAt: .now
            ),
            expression: packet.expression.flatMap(PlantExpression.init(firmwareCode:)),
            acknowledgement: nil
        )
    }

    private struct Packet: Decodable {
        let temperature: Double
        let airHumidity: Double
        let substrateMoisture: Double?
        let light: Double
        let touch: Bool?
        let moving: Bool?
        let expression: String?

        enum CodingKeys: String, CodingKey {
            case temperature = "t"
            case airHumidity = "rh"
            case substrateMoisture = "sm"
            case light = "lux"
            case touch
            case moving
            case expression = "expr"
        }
    }
}
