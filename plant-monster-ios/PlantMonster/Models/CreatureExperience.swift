import Foundation

struct CreatureFeeling: Equatable, Sendable {
    enum Kind: Equatable, Sendable {
        case curious
        case thirsty
        case cold
        case hot
        case lookingForLight
        case tooBright
        case dryAir
        case humidAir
        case settled
        case sleepy
    }

    let kind: Kind
    let headline: String
    let body: String
}

struct CreatureEvidence: Identifiable, Equatable, Sendable {
    let id: String
    let label: String
    let value: String
    let systemImage: String
    let needsAttention: Bool
}

enum CreatureInterpreter {
    static func feeling(
        for telemetry: PlantTelemetry,
        hour: Int = Calendar.current.component(.hour, from: .now)
    ) -> CreatureFeeling {
        if telemetry.isMoving {
            return CreatureFeeling(
                kind: .curious,
                headline: String(localized: "creature.feeling.moving.title"),
                body: String(localized: "creature.feeling.moving.body")
            )
        }

        if let moisture = telemetry.substrateMoisturePercent, moisture < 30 {
            return CreatureFeeling(
                kind: .thirsty,
                headline: String(localized: "creature.feeling.dryFeet.title"),
                body: String(localized: "creature.feeling.dryFeet.body")
            )
        }

        if telemetry.temperatureCelsius < 16 {
            return CreatureFeeling(
                kind: .cold,
                headline: String(localized: "creature.feeling.cold.title"),
                body: String(localized: "creature.feeling.cold.body")
            )
        }

        if telemetry.temperatureCelsius > 30 {
            return CreatureFeeling(
                kind: .hot,
                headline: String(localized: "creature.feeling.hot.title"),
                body: String(localized: "creature.feeling.hot.body")
            )
        }

        if telemetry.lightLux < 150 {
            return CreatureFeeling(
                kind: .lookingForLight,
                headline: String(localized: "creature.feeling.dark.title"),
                body: String(localized: "creature.feeling.dark.body")
            )
        }

        if telemetry.lightLux > 1_200 {
            return CreatureFeeling(
                kind: .tooBright,
                headline: String(localized: "creature.feeling.bright.title"),
                body: String(localized: "creature.feeling.bright.body")
            )
        }

        if telemetry.airHumidityPercent < 35 {
            return CreatureFeeling(
                kind: .dryAir,
                headline: String(localized: "creature.feeling.dryAir.title"),
                body: String(localized: "creature.feeling.dryAir.body")
            )
        }

        if telemetry.airHumidityPercent > 75 {
            return CreatureFeeling(
                kind: .humidAir,
                headline: String(localized: "creature.feeling.humidAir.title"),
                body: String(localized: "creature.feeling.humidAir.body")
            )
        }

        if hour < 6 || hour >= 22 {
            return CreatureFeeling(
                kind: .sleepy,
                headline: String(localized: "creature.feeling.sleepy.title"),
                body: String(localized: "creature.feeling.sleepy.body")
            )
        }

        return CreatureFeeling(
            kind: .settled,
            headline: String(localized: "creature.feeling.settled.title"),
            body: String(localized: "creature.feeling.settled.body")
        )
    }

    static func evidence(for telemetry: PlantTelemetry) -> [CreatureEvidence] {
        [
            CreatureEvidence(
                id: "substrate",
                label: String(localized: "sensor.substrateMoisture"),
                value: telemetry.substrateMoisturePercent.map(percent) ?? String(localized: "sensor.waiting"),
                systemImage: "drop",
                needsAttention: telemetry.substrateMoisturePercent.map { $0 < 30 || $0 > 75 } ?? false
            ),
            CreatureEvidence(
                id: "light",
                label: String(localized: "sensor.lightLux"),
                value: telemetry.lightLux.formatted(.number.precision(.fractionLength(0))),
                systemImage: "sun.max",
                needsAttention: telemetry.lightLux < 150 || telemetry.lightLux > 1_200
            ),
            CreatureEvidence(
                id: "temperature",
                label: String(localized: "sensor.temperature"),
                value: telemetry.temperatureCelsius.formatted(.number.precision(.fractionLength(0))) + "°",
                systemImage: "thermometer.medium",
                needsAttention: telemetry.temperatureCelsius < 16 || telemetry.temperatureCelsius > 30
            ),
            CreatureEvidence(
                id: "airHumidity",
                label: String(localized: "sensor.airHumidity"),
                value: percent(telemetry.airHumidityPercent),
                systemImage: "humidity",
                needsAttention: telemetry.airHumidityPercent < 35 || telemetry.airHumidityPercent > 75
            ),
        ]
    }

    private static func percent(_ value: Double) -> String {
        value.formatted(.number.precision(.fractionLength(0))) + "%"
    }
}
