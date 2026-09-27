import SwiftUI

/// A product-reveal stage: roaming spotlights cross, lock onto the creature,
/// and settle into a quiet breathing state after the entrance.
struct StageSpotlightView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hasEntered = false
    @State private var isRoaming = false
    @State private var flashVisible = false
    @State private var sparklesVisible = false
    var isEngaged = false

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let height = proxy.size.height
            let sparkleXs: [CGFloat] = [0.18, 0.76, 0.82, 0.27]
            let sparkleYs: [CGFloat] = [0.31, 0.22, 0.54, 0.61]

            ZStack {
                Color.black

                SpotlightBeam()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.5),
                                Color.pmPaleSage.opacity(0.2),
                                .clear
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: width * 0.54, height: height * 0.88)
                    .blur(radius: 17)
                    .rotationEffect(
                        .degrees(hasEntered ? (isRoaming ? 13 : 9) : -28),
                        anchor: .top
                    )
                    .offset(
                        x: hasEntered ? (isRoaming ? -width * 0.09 : -width * 0.13) : -width * 0.62,
                        y: -height * 0.12
                    )
                    .opacity(hasEntered ? 0.72 : 0)
                    .blendMode(.screen)

                SpotlightBeam()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.48),
                                Color.pmOLEDGreen.opacity(0.13),
                                .clear
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: width * 0.54, height: height * 0.88)
                    .blur(radius: 17)
                    .rotationEffect(
                        .degrees(hasEntered ? (isRoaming ? -13 : -9) : 28),
                        anchor: .top
                    )
                    .offset(
                        x: hasEntered ? (isRoaming ? width * 0.09 : width * 0.13) : width * 0.62,
                        y: -height * 0.12
                    )
                    .opacity(hasEntered ? 0.72 : 0)
                    .blendMode(.screen)

                SpotlightBeam()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.pmBone.opacity(isEngaged ? 0.68 : 0.48),
                                Color.pmPaleSage.opacity(0.12),
                                .clear
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: width * 0.72, height: height * 0.9)
                    .blur(radius: 22)
                    .offset(y: -height * 0.13)
                    .opacity(hasEntered ? 0.82 : 0)
                    .scaleEffect(hasEntered ? 1 : 0.64, anchor: .top)
                    .blendMode(.screen)

                Ellipse()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.pmBone.opacity(isEngaged ? 0.62 : 0.46),
                                Color.pmOLEDGreen.opacity(isEngaged ? 0.18 : 0.08),
                                .clear
                            ],
                            center: .center,
                            startRadius: 4,
                            endRadius: width * 0.38
                        )
                    )
                    .frame(width: width * (isEngaged ? 0.96 : 0.86), height: height * 0.22)
                    .blur(radius: 10)
                    .offset(y: height * 0.32)
                    .opacity(hasEntered ? 1 : 0)

                Ellipse()
                    .stroke(Color.pmBone.opacity(0.26), lineWidth: 1)
                    .frame(width: width * 0.82, height: height * 0.18)
                    .blur(radius: 2)
                    .offset(y: height * 0.32)
                    .scaleEffect(hasEntered ? 1 : 0.45)
                    .opacity(hasEntered ? 0.82 : 0)

                ForEach(0..<4, id: \.self) { index in
                    Image(systemName: "sparkle")
                        .font(.system(size: index.isMultiple(of: 2) ? 16 : 10, weight: .semibold))
                        .foregroundStyle(index == 2 ? Color.pmOLEDGreen : Color.pmBone)
                        .shadow(color: Color.white.opacity(0.6), radius: 7)
                        .position(
                            x: width * sparkleXs[index],
                            y: height * sparkleYs[index]
                        )
                        .scaleEffect(sparklesVisible ? 1 : 0.2)
                        .opacity(sparklesVisible ? (isRoaming ? 0.34 : 0.82) : 0)
                }

                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color.white.opacity(0.9), Color.pmOLEDGreen.opacity(0.18), .clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: width * 0.34
                        )
                    )
                    .frame(width: width * 0.72, height: width * 0.72)
                    .offset(y: height * 0.05)
                    .scaleEffect(flashVisible ? 1 : 0.36)
                    .opacity(flashVisible ? 0.72 : 0)
                    .blendMode(.screen)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .task {
            guard !reduceMotion else {
                hasEntered = true
                sparklesVisible = true
                return
            }

            withAnimation(.easeOut(duration: 1.25)) {
                hasEntered = true
            }

            try? await Task.sleep(nanoseconds: 620_000_000)
            withAnimation(.easeIn(duration: 0.08)) {
                flashVisible = true
            }
            try? await Task.sleep(nanoseconds: 100_000_000)
            withAnimation(.easeOut(duration: 0.72)) {
                flashVisible = false
                sparklesVisible = true
            }

            try? await Task.sleep(nanoseconds: 720_000_000)
            withAnimation(.easeInOut(duration: 3.8).repeatForever(autoreverses: true)) {
                isRoaming = true
            }
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: isEngaged)
    }
}

private struct SpotlightBeam: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX - rect.width * 0.08, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.midX + rect.width * 0.08, y: rect.minY))
        path.addCurve(
            to: CGPoint(x: rect.maxX, y: rect.maxY),
            control1: CGPoint(x: rect.midX + rect.width * 0.14, y: rect.height * 0.32),
            control2: CGPoint(x: rect.maxX - rect.width * 0.1, y: rect.height * 0.7)
        )
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.addCurve(
            to: CGPoint(x: rect.midX - rect.width * 0.08, y: rect.minY),
            control1: CGPoint(x: rect.minX + rect.width * 0.1, y: rect.height * 0.7),
            control2: CGPoint(x: rect.midX - rect.width * 0.14, y: rect.height * 0.32)
        )
        path.closeSubpath()
        return path
    }
}
