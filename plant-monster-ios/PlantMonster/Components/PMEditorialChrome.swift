import SwiftUI

struct PMEditorialHeader: View {
    let section: LocalizedStringKey
    let status: String
    var actionTitle: LocalizedStringKey?
    var action: (() -> Void)?

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Text(section)
                .font(.system(.caption, design: .monospaced, weight: .medium))
                .tracking(1.2)
                .foregroundStyle(Color.white.opacity(0.82))
                .lineLimit(1)
                .minimumScaleFactor(0.8)

            Spacer(minLength: 8)

            if let actionTitle, let action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(.system(.caption2, design: .monospaced, weight: .semibold))
                        .tracking(1.05)
                        .foregroundStyle(Color.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.76)
                        .frame(minWidth: 44, minHeight: 44, alignment: .topTrailing)
                }
                .buttonStyle(PMTactileButtonStyle())
            } else {
                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 7) {
                        Text("editorial.live")
                        Circle()
                            .fill(Color.pmOLEDGreen)
                            .frame(width: 8, height: 8)
                            .shadow(color: Color.pmOLEDGreen.opacity(0.8), radius: 7)
                    }
                    Text(status.uppercased())
                        .foregroundStyle(Color.white.opacity(0.58))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                .font(.system(.caption2, design: .monospaced, weight: .medium))
                .tracking(1.1)
                .accessibilityElement(children: .combine)
            }
        }
        .frame(minHeight: PMTheme.minimumTapTarget)
    }
}

struct PMEditorialFooter: View {
    let phrase: LocalizedStringKey

    var body: some View {
        HStack(alignment: .bottom, spacing: 18) {
            VStack(alignment: .leading, spacing: 7) {
                Rectangle()
                    .fill(Color.white.opacity(0.5))
                    .frame(width: 28, height: 1)
                Text(phrase)
                    .font(.system(.caption2, design: .monospaced, weight: .medium))
                    .tracking(2)
                    .foregroundStyle(Color.white.opacity(0.64))
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 12)

            Text("PLANT MONSTER")
                .font(.system(.caption2, design: .monospaced, weight: .medium))
                .foregroundStyle(Color.white.opacity(0.78))
                .lineLimit(1)
                .minimumScaleFactor(0.76)
                .layoutPriority(1)
        }
    }
}

struct PMRadarView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var rotation = 0.0
    var active = false

    var body: some View {
        GeometryReader { proxy in
            let side = min(proxy.size.width, proxy.size.height)

            ZStack {
                ForEach(1..<5, id: \.self) { index in
                    Circle()
                        .stroke(Color.white.opacity(0.08 + Double(index) * 0.015), lineWidth: 1)
                        .frame(
                            width: side * CGFloat(index) / 4,
                            height: side * CGFloat(index) / 4
                        )
                }

                Rectangle()
                    .fill(Color.white.opacity(0.12))
                    .frame(width: 1, height: side)
                Rectangle()
                    .fill(Color.white.opacity(0.12))
                    .frame(width: side, height: 1)

                Circle()
                    .trim(from: 0.02, to: active ? 0.34 : 0.2)
                    .stroke(
                        AngularGradient(
                            colors: [.clear, Color.pmOLEDGreen.opacity(active ? 0.95 : 0.42), .clear],
                            center: .center
                        ),
                        style: StrokeStyle(lineWidth: active ? 2 : 1, lineCap: .round)
                    )
                    .frame(width: side * 0.88, height: side * 0.88)
                    .rotationEffect(.degrees(rotation))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.linear(duration: active ? 2.8 : 8).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        }
        .onChange(of: active) { _, _ in
            guard !reduceMotion else { return }
            rotation = 0
            withAnimation(.linear(duration: active ? 2.8 : 8).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        }
    }
}

struct PMSignalRingsView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var expanded = false
    var active = true

    var body: some View {
        ZStack {
            ForEach(0..<6, id: \.self) { index in
                Ellipse()
                    .stroke(Color.pmOLEDGreen.opacity(0.56 - Double(index) * 0.07), lineWidth: 1.2)
                    .frame(
                        width: 110 + CGFloat(index * 42),
                        height: 54 + CGFloat(index * 25)
                    )
                    .scaleEffect(expanded && active && !reduceMotion ? 1.18 : 0.86)
                    .opacity(expanded && active ? 0.08 : 0.86)
                    .animation(
                        reduceMotion ? nil : .easeOut(duration: 1.05).delay(Double(index) * 0.07),
                        value: expanded
                    )
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear { expanded = true }
        .onChange(of: active) { _, isActive in
            expanded = false
            guard isActive else { return }
            Task { @MainActor in
                await Task.yield()
                expanded = true
            }
        }
    }
}
