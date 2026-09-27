import SwiftUI

enum PMTheme {
    static let pagePadding: CGFloat = 20
    static let contentCornerRadius: CGFloat = 0
    static let controlCornerRadius: CGFloat = 0
    static let minimumTapTarget: CGFloat = 44
    static let hairline = Color.white.opacity(0.22)
    static let mutedInk = Color.white.opacity(0.58)
}

extension Color {
    static let pmSage = Color("PMSage")
    static let pmPaleSage = Color("PMPaleSage")
    static let pmAubergine = Color("PMAubergine")
    static let pmSmokedGlass = Color("PMSmokedGlass")
    static let pmBone = Color("PMBone")
    static let pmOLEDGreen = Color("PMOLEDGreen")
    static let pmInk = Color(red: 0.018, green: 0.024, blue: 0.02)
}

struct PMDisplayText: ViewModifier {
    @ScaledMetric(relativeTo: .largeTitle) private var size: CGFloat = 48
    let color: Color

    init(size: CGFloat = 48, color: Color) {
        _size = ScaledMetric(wrappedValue: size, relativeTo: .largeTitle)
        self.color = color
    }

    func body(content: Content) -> some View {
        content
            .font(.system(size: size, weight: .semibold, design: .default))
            .foregroundStyle(color)
            .tracking(-1.1)
    }
}

extension View {
    func pmDisplay(size: CGFloat = 48, color: Color) -> some View {
        modifier(PMDisplayText(size: size, color: color))
    }
}

struct PMTactileButtonStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.955 : 1)
            .opacity(configuration.isPressed ? 0.72 : 1)
            .animation(
                reduceMotion ? nil : .snappy(duration: 0.18, extraBounce: 0.08),
                value: configuration.isPressed
            )
    }
}

struct PMChapterLabel: View {
    let index: String
    let title: LocalizedStringKey
    var trailingLabel: LocalizedStringKey?

    var body: some View {
        HStack(spacing: 12) {
            Text(index)
                .font(.system(.caption2, design: .monospaced, weight: .semibold))
                .foregroundStyle(Color.pmOLEDGreen)

            Text(title)
                .font(.caption.weight(.semibold))
                .tracking(1.35)
                .foregroundStyle(Color.pmBone.opacity(0.76))

            Rectangle()
                .fill(Color.pmBone.opacity(0.18))
                .frame(height: 1)

            if let trailingLabel {
                Text(trailingLabel)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(Color.pmBone.opacity(0.58))
            }
        }
        .accessibilityElement(children: .combine)
    }
}

struct PMEditorialTitle: ViewModifier {
    @ScaledMetric(relativeTo: .largeTitle) private var size: CGFloat = 58

    init(size: CGFloat = 58) {
        _size = ScaledMetric(wrappedValue: size, relativeTo: .largeTitle)
    }

    func body(content: Content) -> some View {
        content
            .font(.system(size: size, weight: .black, design: .default))
            .tracking(-2.1)
            .textCase(.uppercase)
            .foregroundStyle(Color.white)
            .lineSpacing(-7)
            .fixedSize(horizontal: false, vertical: true)
    }
}

extension View {
    func pmEditorialTitle(size: CGFloat = 58) -> some View {
        modifier(PMEditorialTitle(size: size))
    }
}
