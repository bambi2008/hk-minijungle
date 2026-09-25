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

    var hapticsEnabled = true
    var controlColor: Color = .pmAubergine
    var onTap: (() -> Void)?

    var body: some View {
        ZStack(alignment: .bottom) {
            turntableFrame
                .transaction { transaction in
                    // Sprite-sheet offsets must snap. Animating the offset exposes
                    // neighbouring cells and looks like overlapping products.
                    transaction.animation = nil
                }

            HStack(spacing: 5) {
                ForEach(0..<Self.frameCount, id: \.self) { index in
                    Capsule()
                        .fill(controlColor.opacity(index == frameIndex ? 0.9 : 0.24))
                        .frame(width: index == frameIndex ? 18 : 5, height: 5)
                        .animation(reduceMotion ? nil : .easeOut(duration: 0.16), value: frameIndex)
                }
            }
            .padding(.horizontal, 14)
            .frame(height: 30)
            .background(.ultraThinMaterial, in: Capsule())
            .padding(.bottom, 4)
            .opacity(isDragging ? 0.58 : 1)

            Label("turntable.dragHint", systemImage: "hand.draw")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(controlColor.opacity(0.78))
                .padding(.horizontal, 12)
                .frame(height: 30)
                .background(.ultraThinMaterial, in: Capsule())
                .padding(.bottom, 42)
                .opacity(isDragging ? 0 : 1)
        }
        .aspectRatio(1, contentMode: .fit)
        .scaleEffect(isDragging && !reduceMotion ? 1.012 : 1)
        .contentShape(Rectangle())
        .gesture(rotationGesture)
        .simultaneousGesture(
            TapGesture().onEnded { onTap?() }
        )
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
        .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: isDragging)
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
                let delta = Int((-value.translation.width / 24).rounded(.towardZero))
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
