import SwiftUI

struct PMBackgroundView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @State private var isDrifting = false

    var body: some View {
        ZStack {
            Image("botanical-background")
                .resizable()
                .scaledToFill()

            LinearGradient(
                colors: [
                    Color.pmSage.opacity(reduceTransparency ? 0.82 : 0.5),
                    Color.pmAubergine.opacity(0.18),
                    Color.pmSmokedGlass.opacity(0.48)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            GeometryReader { proxy in
                Circle()
                    .fill(Color.pmOLEDGreen.opacity(0.13))
                    .frame(width: proxy.size.width * 0.74, height: proxy.size.width * 0.74)
                    .blur(radius: reduceTransparency ? 0 : 64)
                    .offset(
                        x: isDrifting ? proxy.size.width * 0.42 : -proxy.size.width * 0.18,
                        y: isDrifting ? proxy.size.height * 0.54 : proxy.size.height * 0.16
                    )

                Circle()
                    .fill(Color.pmBone.opacity(0.12))
                    .frame(width: proxy.size.width * 0.9, height: proxy.size.width * 0.9)
                    .blur(radius: reduceTransparency ? 0 : 86)
                    .offset(
                        x: isDrifting ? -proxy.size.width * 0.32 : proxy.size.width * 0.38,
                        y: isDrifting ? proxy.size.height * 0.04 : proxy.size.height * 0.56
                    )
            }
            .opacity(reduceTransparency ? 0.16 : 1)
        }
        .ignoresSafeArea()
        .accessibilityHidden(true)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 11).repeatForever(autoreverses: true)) {
                isDrifting = true
            }
        }
    }
}
