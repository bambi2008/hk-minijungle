import SwiftUI

struct PMBackgroundView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @State private var isDrifting = false
    var signalStrength: Double = 0.34
    var interaction: CGFloat = 0

    var body: some View {
        ZStack {
            Color.pmInk

            Image("botanical-background")
                .resizable()
                .scaledToFill()
                .saturation(0)
                .contrast(1.2)
                .opacity(reduceTransparency ? 0.08 : 0.18)
                .scaleEffect(isDrifting && !reduceMotion ? 1.06 : 1)
                .rotation3DEffect(
                    .degrees(reduceMotion ? 0 : Double(interaction * 2.4)),
                    axis: (x: 0, y: 1, z: 0),
                    perspective: 0.32
                )
                .offset(
                    x: (isDrifting && !reduceMotion ? -16 : 10) + interaction * 15,
                    y: isDrifting ? 12 : -8
                )

            LinearGradient(
                colors: [
                    Color.black.opacity(0.34),
                    Color.pmInk.opacity(0.74),
                    Color.black.opacity(0.92)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            GeometryReader { proxy in
                Circle()
                    .fill(Color.pmOLEDGreen.opacity(signalStrength * 0.24))
                    .frame(width: proxy.size.width * 0.78, height: proxy.size.width * 0.78)
                    .blur(radius: reduceTransparency ? 0 : 72)
                    .offset(
                        x: (isDrifting ? proxy.size.width * 0.46 : -proxy.size.width * 0.36)
                            + interaction * 44,
                        y: isDrifting ? proxy.size.height * 0.18 : proxy.size.height * 0.62
                    )

                Circle()
                    .fill(Color.white.opacity(0.09))
                    .frame(width: proxy.size.width * 0.8, height: proxy.size.width * 0.8)
                    .blur(radius: reduceTransparency ? 0 : 90)
                    .offset(
                        x: (isDrifting ? -proxy.size.width * 0.42 : proxy.size.width * 0.55)
                            - interaction * 32,
                        y: isDrifting ? proxy.size.height * 0.46 : proxy.size.height * 0.06
                    )
            }
            .opacity(reduceTransparency ? 0.12 : 1)

            LinearGradient(
                colors: [.clear, Color.black.opacity(0.36)],
                startPoint: .center,
                endPoint: .bottom
            )
        }
        .ignoresSafeArea()
        .accessibilityHidden(true)
        .animation(reduceMotion ? nil : .interactiveSpring(response: 0.42, dampingFraction: 0.82), value: interaction)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 12).repeatForever(autoreverses: true)) {
                isDrifting = true
            }
        }
    }
}
