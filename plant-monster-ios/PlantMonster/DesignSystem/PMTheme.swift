import SwiftUI

enum PMTheme {
    static let pagePadding: CGFloat = 24
    static let contentCornerRadius: CGFloat = 28
    static let controlCornerRadius: CGFloat = 18
    static let minimumTapTarget: CGFloat = 44
}

extension Color {
    static let pmSage = Color("PMSage")
    static let pmPaleSage = Color("PMPaleSage")
    static let pmAubergine = Color("PMAubergine")
    static let pmSmokedGlass = Color("PMSmokedGlass")
    static let pmBone = Color("PMBone")
    static let pmOLEDGreen = Color("PMOLEDGreen")
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
