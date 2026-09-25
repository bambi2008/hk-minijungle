import SwiftUI

/// A restrained product-stage treatment that keeps the creature readable without
/// competing with direct-manipulation gestures on the turntable.
struct StageSpotlightView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hasEntered = false
    @State private var isBreathing = false

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let height = proxy.size.height

            ZStack {
                SpotlightBeam()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.pmBone.opacity(0.46),
                                Color.pmPaleSage.opacity(0.18),
                                .clear
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: width * 0.82, height: height * 0.82)
                    .blur(radius: 15)
                    .offset(y: -height * 0.08)

                Ellipse()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.pmBone.opacity(0.42),
                                Color.pmPaleSage.opacity(0.15),
                                .clear
                            ],
                            center: .center,
                            startRadius: 4,
                            endRadius: width * 0.38
                        )
                    )
                    .frame(width: width * 0.86, height: height * 0.22)
                    .blur(radius: 9)
                    .offset(y: height * 0.31)

                Ellipse()
                    .fill(Color.black.opacity(0.19))
                    .frame(width: width * 0.56, height: height * 0.085)
                    .blur(radius: 13)
                    .offset(y: height * 0.34)
            }
            .opacity(hasEntered ? (isBreathing ? 0.92 : 0.78) : 0)
            .scaleEffect(hasEntered ? (isBreathing ? 1.025 : 1) : 0.88, anchor: .bottom)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear {
            guard !reduceMotion else {
                hasEntered = true
                isBreathing = false
                return
            }

            withAnimation(.easeOut(duration: 1.05)) {
                hasEntered = true
            }

            withAnimation(.easeInOut(duration: 3.8).repeatForever(autoreverses: true).delay(1.05)) {
                isBreathing = true
            }
        }
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
