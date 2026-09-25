import Foundation
import SwiftUI
import UIKit

struct PlantMonsterTurntableView: View {
    private static let frameCount = 8
    private static let columns = 4

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var frameIndex = 0
    @State private var dragOriginFrame = 0
    @State private var isDragging = false

    var expression: PlantExpression?
    var hapticsEnabled = true
    var controlColor: Color = .pmAubergine
    var onTap: (() -> Void)?

    var body: some View {
        VStack(spacing: 10) {
            ZStack {
                turntableFrame

                if let expression, frameIndex == 0 {
                    GeometryReader { proxy in
                        OLEDExpressionView(expression: expression, width: proxy.size.width * 0.28)
                            .position(x: proxy.size.width * 0.5, y: proxy.size.height * 0.34)
                            .transition(.opacity)
                            .allowsHitTesting(false)
                    }
                }
            }
            .aspectRatio(1, contentMode: .fit)
            .contentShape(Rectangle())
            .gesture(rotationGesture)
            .simultaneousGesture(
                TapGesture().onEnded { onTap?() }
            )

            HStack(spacing: 2) {
                Button {
                    step(by: -1)
                } label: {
                    Image(systemName: "chevron.left")
                        .frame(width: PMTheme.minimumTapTarget, height: PMTheme.minimumTapTarget)
                }
                .accessibilityLabel(Text("turntable.previous"))

                Label("turntable.dragHint", systemImage: "hand.draw")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(controlColor.opacity(0.76))
                    .frame(maxWidth: .infinity)

                Button {
                    step(by: 1)
                } label: {
                    Image(systemName: "chevron.right")
                        .frame(width: PMTheme.minimumTapTarget, height: PMTheme.minimumTapTarget)
                }
                .accessibilityLabel(Text("turntable.next"))
            }
            .foregroundStyle(controlColor)
            .padding(.horizontal, 4)
            .background(.ultraThinMaterial, in: Capsule())
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text("turntable.accessibilityLabel"))
        .accessibilityValue(Text(angleAccessibilityValue))
        .accessibilityHint(Text("turntable.accessibilityHint"))
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: step(by: 1)
            case .decrement: step(by: -1)
            @unknown default: break
            }
        }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.12), value: frameIndex)
    }

    private var turntableFrame: some View {
        GeometryReader { proxy in
            let side = min(proxy.size.width, proxy.size.height)
            let column = frameIndex % Self.columns
            let row = frameIndex / Self.columns

            Image("plant-monster-turntable")
                .resizable()
                .interpolation(.high)
                .frame(width: side * CGFloat(Self.columns), height: side * 2)
                .offset(x: -CGFloat(column) * side, y: -CGFloat(row) * side)
        }
        .clipped()
        .accessibilityHidden(true)
    }

    private var rotationGesture: some Gesture {
        DragGesture(minimumDistance: 6)
            .onChanged { value in
                if !isDragging {
                    isDragging = true
                    dragOriginFrame = frameIndex
                }
                let delta = Int((-value.translation.width / 30).rounded(.towardZero))
                setFrame(dragOriginFrame + delta)
            }
            .onEnded { _ in
                isDragging = false
            }
    }

    private var angleAccessibilityValue: String {
        String(
            format: String(localized: "turntable.angleValue"),
            frameIndex + 1,
            Self.frameCount
        )
    }

    private func step(by delta: Int) {
        setFrame(frameIndex + delta, alwaysPlayHaptic: true)
    }

    private func setFrame(_ proposed: Int, alwaysPlayHaptic: Bool = false) {
        let wrapped = (proposed % Self.frameCount + Self.frameCount) % Self.frameCount
        guard wrapped != frameIndex else { return }
        frameIndex = wrapped

        guard hapticsEnabled, alwaysPlayHaptic || wrapped.isMultiple(of: 2) else { return }
        UISelectionFeedbackGenerator().selectionChanged()
    }
}
