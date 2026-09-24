import SwiftUI

struct TouchRippleView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var expanded = false

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .stroke(Color.pmOLEDGreen.opacity(0.48 - Double(index) * 0.1), lineWidth: 1)
                    .frame(width: 122 + CGFloat(index * 46), height: 122 + CGFloat(index * 46))
                    .scaleEffect(expanded && !reduceMotion ? 1.18 : 0.9)
                    .opacity(expanded ? 0.12 : 0.72)
                    .animation(
                        reduceMotion ? nil : .easeOut(duration: 0.75).delay(Double(index) * 0.08),
                        value: expanded
                    )
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear { expanded = true }
    }
}
