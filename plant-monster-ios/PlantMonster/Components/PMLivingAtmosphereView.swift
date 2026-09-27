import SwiftUI

struct PMLivingAtmosphereView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @State private var touchWaveExpanded = false

    var interaction: CGFloat = 0
    var scrollProgress: CGFloat = 0
    var intensity: Double = 0.36
    var isTouchActive = false

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: reduceMotion)) { timeline in
            GeometryReader { proxy in
                let time = reduceMotion ? 0 : timeline.date.timeIntervalSinceReferenceDate
                let width = proxy.size.width
                let height = proxy.size.height
                let drift = CGFloat(sin(time * 0.17))

                ZStack {
                    LinearGradient(
                        colors: [
                            .clear,
                            Color.pmOLEDGreen.opacity(0.035 + intensity * 0.035),
                            .clear
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .frame(width: width * 1.45, height: height * 0.34)
                    .rotationEffect(.degrees(-18 + Double(interaction * 5)))
                    .offset(
                        x: interaction * 46 + drift * 18,
                        y: -height * 0.2 + scrollProgress * 180
                    )
                    .blendMode(.screen)

                    ForEach(0..<14, id: \.self) { index in
                        let seed = particleSeed(index)
                        let travel = (time * (5.5 + Double(index % 4)) + Double(index * 73))
                            .truncatingRemainder(dividingBy: max(Double(height + 120), 1))
                        let x = width * seed + interaction * CGFloat(12 + index % 5)
                        let y = height + 36 - CGFloat(travel)

                        Circle()
                            .fill(index.isMultiple(of: 4) ? Color.pmOLEDGreen : Color.white)
                            .frame(
                                width: index.isMultiple(of: 3) ? 2.2 : 1.2,
                                height: index.isMultiple(of: 3) ? 2.2 : 1.2
                            )
                            .opacity(reduceTransparency ? 0.08 : 0.12 + intensity * 0.18)
                            .position(x: x, y: y)
                    }

                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [.clear, Color.white.opacity(0.16), .clear],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(height: 1)
                        .offset(
                            y: -height / 2
                                + CGFloat((time * 18).truncatingRemainder(dividingBy: max(Double(height), 1)))
                        )
                        .opacity(reduceMotion ? 0 : 0.16 + intensity * 0.2)

                    touchWave
                        .position(
                            x: width * 0.5 + interaction * 24,
                            y: min(height * 0.32 + scrollProgress * 40, 330)
                        )
                }
                .compositingGroup()
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear {
            if isTouchActive { playTouchWave() }
        }
        .onChange(of: isTouchActive) { _, active in
            if active { playTouchWave() }
        }
    }

    private var touchWave: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { index in
                Circle()
                    .stroke(
                        Color.pmOLEDGreen.opacity(0.5 - Double(index) * 0.09),
                        lineWidth: index == 0 ? 1.6 : 0.8
                    )
                    .frame(
                        width: 110 + CGFloat(index * 42),
                        height: 110 + CGFloat(index * 42)
                    )
                    .scaleEffect(touchWaveExpanded && !reduceMotion ? 2.25 : 0.38)
                    .opacity(touchWaveExpanded && !reduceMotion ? 0 : (isTouchActive ? 0.76 : 0))
                    .animation(
                        reduceMotion
                            ? nil
                            : .easeOut(duration: 1.25).delay(Double(index) * 0.055),
                        value: touchWaveExpanded
                    )
            }
        }
    }

    private func playTouchWave() {
        touchWaveExpanded = false
        guard !reduceMotion else { return }
        Task { @MainActor in
            await Task.yield()
            touchWaveExpanded = true
        }
    }

    private func particleSeed(_ index: Int) -> CGFloat {
        CGFloat((index * 47 + 19) % 101) / 100
    }
}
