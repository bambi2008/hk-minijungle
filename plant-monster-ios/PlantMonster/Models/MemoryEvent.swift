import Foundation

struct MemoryEvent: Identifiable, Equatable, Sendable {
    enum Kind: Sendable {
        case light
        case touch
        case motion

        var iconName: String {
            switch self {
            case .light: "sun.max.fill"
            case .touch: "hand.tap.fill"
            case .motion: "move.3d"
            }
        }
    }

    let id: UUID
    let date: Date
    let title: String
    let kind: Kind
    let expression: PlantExpression

    init(
        id: UUID = UUID(),
        date: Date,
        title: String,
        kind: Kind,
        expression: PlantExpression
    ) {
        self.id = id
        self.date = date
        self.title = title
        self.kind = kind
        self.expression = expression
    }

    static var samples: [MemoryEvent] {
        let calendar = Calendar.current
        let now = Date.now
        return [
            MemoryEvent(
                date: calendar.date(bySettingHour: 10, minute: 32, second: 0, of: now) ?? now,
                title: String(localized: "memory.sawLight"),
                kind: .light,
                expression: .sunComfy
            ),
            MemoryEvent(
                date: calendar.date(bySettingHour: 9, minute: 18, second: 0, of: now) ?? now,
                title: String(localized: "memory.youWereHere"),
                kind: .touch,
                expression: .pet
            )
        ]
    }
}
