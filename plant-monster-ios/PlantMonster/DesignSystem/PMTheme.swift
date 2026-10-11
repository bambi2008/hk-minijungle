import SwiftUI

enum PMTheme {
    static let pagePadding: CGFloat = 24
    static let contentCornerRadius: CGFloat = 24
    static let controlCornerRadius: CGFloat = 18
    static let minimumTapTarget: CGFloat = 44
    static let hairline = Color.white.opacity(0.10)
    static let mutedInk = Color.white.opacity(0.58)
}

extension Color {
    static let pmSage = Color("PMSage")
    static let pmPaleSage = Color("PMPaleSage")
    static let pmAubergine = Color("PMAubergine")
    static let pmSmokedGlass = Color("PMSmokedGlass")
    static let pmBone = Color("PMBone")
    static let pmOLEDGreen = Color("PMOLEDGreen")
    static let pmInk = Color(red: 0.055, green: 0.058, blue: 0.068)
    static let pmSurface = Color(red: 0.105, green: 0.11, blue: 0.125)
    static let pmLilac = Color(red: 0.77, green: 0.73, blue: 0.91)
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
        _size = ScaledMetric(wrappedValue: min(size, 34), relativeTo: .largeTitle)
    }

    func body(content: Content) -> some View {
        content
            .font(.system(size: size, weight: .semibold, design: .default))
            .tracking(-0.9)
            .foregroundStyle(Color.white)
            .lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
    }
}

extension View {
    func pmEditorialTitle(size: CGFloat = 58) -> some View {
        modifier(PMEditorialTitle(size: size))
    }

    func pmHardwarePanel() -> some View {
        background(Color.pmSurface.opacity(0.84), in: RoundedRectangle(cornerRadius: PMTheme.contentCornerRadius))
            .overlay {
                RoundedRectangle(cornerRadius: PMTheme.contentCornerRadius)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            }
    }
}
