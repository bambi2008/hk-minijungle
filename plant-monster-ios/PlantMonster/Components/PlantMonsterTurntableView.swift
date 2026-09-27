import Foundation
import SwiftUI
import UIKit

struct PlantMonsterTurntableView: View {
    private static let frameCount = 8
    private static let columns = 4

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AppStorage("plantMonster.hasExploredTurntable") private var hasExploredTurntable = false
    @GestureState private var dragOffset: CGFloat = 0
    @State private var frameIndex = 0
    @State private var isDragging = false
    @State private var dragOriginFrame = 0
    @State private var dragFrameDelta = 0

    var hapticsEnabled = true
    var controlColor: Color = .pmAubergine
    var onTap: (() -> Void)?
    var onInteractionChanged: ((Bool) -> Void)?

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            interactiveProduct

            HStack(spacing: 10) {
                turnButton(systemImage: "chevron.left", label: "turntable.previous") {
                    step(by: -1)
                }

                turnButton(systemImage: "chevron.right", label: "turntable.next") {
                    step(by: 1)
                }

                Spacer(minLength: 8)

                Text(String(format: "%02d / %02d", frameIndex + 1, Self.frameCount))
                    .font(.system(.caption2, design: .monospaced, weight: .semibold))
                    .foregroundStyle(controlColor.opacity(0.8))
                    .monospacedDigit()
                    .padding(.horizontal, 12)
                    .frame(minHeight: PMTheme.minimumTapTarget)
                    .background(.thinMaterial, in: Capsule())
                    .contentTransition(.numericText(value: Double(frameIndex)))
                    .animation(reduceMotion ? nil : .easeInOut(duration: 0.2), value: frameIndex)
            }
            .padding(.horizontal, 10)
            .padding(.bottom, 6)

            if !hasExploredTurntable && !isDragging {
                Label("turntable.dragHint", systemImage: "hand.draw.fill")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(controlColor.opacity(0.82))
                    .padding(.horizontal, 14)
                    .frame(minHeight: 38)
                    .background(.thinMaterial, in: Capsule())
                    .padding(.leading, 10)
                    .padding(.bottom, 58)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .allowsHitTesting(false)
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: hasExploredTurntable)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: isDragging)
    }

    private var interactiveProduct: some View {
        let normalizedDrag = max(-1, min(1, dragOffset / 140))

        return turntableFrame
            .transaction { transaction in
                // Sprite-sheet offsets must snap. Animating the crop exposes
                // neighbouring cells and looks like overlapping products.
                transaction.animation = nil
            }
            .offset(x: dragOffset * 0.12)
            .rotation3DEffect(
                .degrees(reduceMotion ? 0 : Double(normalizedDrag * 6)),
                axis: (x: 0, y: 1, z: 0),
                perspective: 0.55
            )
            .scaleEffect(isDragging && !reduceMotion ? 1.018 : 1)
            .contentShape(Rectangle())
            .gesture(rotationGesture)
            .simultaneousGesture(TapGesture().onEnded { handleTap() })
            .accessibilityElement(children: .ignore)
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
        DragGesture(minimumDistance: 8)
            .updating($dragOffset) { value, state, transaction in
                transaction.animation = nil
                state = value.translation.width
            }
            .onChanged { value in
                if !isDragging {
                    isDragging = true
                    dragOriginFrame = frameIndex
                    dragFrameDelta = 0
                    hasExploredTurntable = true
                    onInteractionChanged?(true)
                }

                let delta = Int((-value.translation.width / 82).rounded(.towardZero))
                guard delta != dragFrameDelta else { return }
                dragFrameDelta = delta
                setFrame(dragOriginFrame + delta)
            }
            .onEnded { value in
                isDragging = false
                onInteractionChanged?(false)

                let projected = value.predictedEndTranslation.width
                if dragFrameDelta == 0, abs(projected) > 64 {
                    setFrame(
                        dragOriginFrame + (projected < 0 ? 1 : -1),
                        alwaysPlayHaptic: true
                    )
                } else if hapticsEnabled, dragFrameDelta != 0 {
                    UISelectionFeedbackGenerator().selectionChanged()
                }

                dragFrameDelta = 0
            }
    }

    private func turnButton(
        systemImage: String,
        label: LocalizedStringKey,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(controlColor.opacity(0.84))
                .frame(width: PMTheme.minimumTapTarget, height: PMTheme.minimumTapTarget)
                .background(.thinMaterial, in: Circle())
        }
        .buttonStyle(PMTactileButtonStyle())
        .accessibilityLabel(Text(label))
    }

    private var angleAccessibilityValue: String {
        String(
            format: String(localized: "turntable.angleValue"),
            frameIndex + 1,
            Self.frameCount
        )
    }

    private var isFaceVisible: Bool {
        frameIndex == 0 || frameIndex == 1 || frameIndex == Self.frameCount - 1
    }

    private func handleTap() {
        if isFaceVisible {
            onTap?()
        } else {
            setFrame(0, alwaysPlayHaptic: true)
        }
    }

    private func step(by delta: Int) {
        hasExploredTurntable = true
        setFrame(frameIndex + delta, alwaysPlayHaptic: true)
    }

    private func setFrame(_ proposed: Int, alwaysPlayHaptic: Bool = false) {
        let wrapped = (proposed % Self.frameCount + Self.frameCount) % Self.frameCount
        guard wrapped != frameIndex else { return }
        frameIndex = wrapped

        guard hapticsEnabled, alwaysPlayHaptic else { return }
        UISelectionFeedbackGenerator().selectionChanged()
    }
}
