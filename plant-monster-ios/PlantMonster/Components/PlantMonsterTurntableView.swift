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
    @State private var isBreathing = false
    @State private var hasMadeEntrance = false
    @State private var dragOriginFrame = 0
    @State private var dragFrameDelta = 0

    var hapticsEnabled = true
    var controlColor: Color = .white
    var showsChrome = true
    var accessory: MonsterAccessory = .none
    var onTap: (() -> Void)?
    var onInteractionChanged: ((Bool) -> Void)?
    var onInteractionProgress: ((CGFloat) -> Void)?

    var body: some View {
        ZStack {
            StageSpotlightView(isEngaged: isDragging)

            if showsChrome {
                PMRadarView(active: isDragging)
                    .padding(28)
            }

            interactiveProduct
                .padding(.horizontal, showsChrome ? 12 : 0)
                .padding(.bottom, showsChrome ? 38 : 0)

            if showsChrome {
                VStack(spacing: 0) {
                    Spacer()

                    HStack(spacing: 12) {
                        turnButton(systemImage: "chevron.left", label: "turntable.previous") {
                            step(by: -1)
                        }

                        VStack(spacing: 7) {
                            HStack(spacing: 4) {
                                ForEach(0..<Self.frameCount, id: \.self) { index in
                                    Capsule()
                                        .fill(index == frameIndex ? Color.pmOLEDGreen : controlColor.opacity(0.18))
                                        .frame(width: index == frameIndex ? 20 : 5, height: 2)
                                }
                            }

                            Text(String(format: "%02d  /  %02d", frameIndex + 1, Self.frameCount))
                                .font(.system(.caption2, design: .monospaced, weight: .semibold))
                                .tracking(1.1)
                                .foregroundStyle(controlColor.opacity(0.72))
                                .contentTransition(.numericText(value: Double(frameIndex)))
                        }
                        .frame(maxWidth: .infinity)

                        turnButton(systemImage: "chevron.right", label: "turntable.next") {
                            step(by: 1)
                        }
                    }
                }
            }

            if showsChrome && !hasExploredTurntable && !isDragging {
                VStack {
                    Spacer()
                    Label("turntable.dragHint", systemImage: "hand.draw")
                        .font(.system(.caption2, design: .monospaced, weight: .semibold))
                        .tracking(1.1)
                        .foregroundStyle(controlColor.opacity(0.76))
                        .padding(.bottom, 64)
                }
                .transition(.opacity)
                .allowsHitTesting(false)
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: hasExploredTurntable)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.16), value: isDragging)
        .onAppear {
            guard !reduceMotion else {
                hasMadeEntrance = true
                return
            }

            withAnimation(.spring(response: 0.88, dampingFraction: 0.78).delay(0.28)) {
                hasMadeEntrance = true
            }

            withAnimation(.easeInOut(duration: 3.6).repeatForever(autoreverses: true)) {
                isBreathing = true
            }
        }
    }

    private var interactiveProduct: some View {
        let normalizedDrag = max(-1, min(1, dragOffset / 100))

        return productComposite
            .offset(
                x: dragOffset * 0.07,
                y: isBreathing && !isDragging && !reduceMotion ? -3 : 1
            )
            .rotation3DEffect(
                .degrees(reduceMotion ? 0 : Double(normalizedDrag * 10)),
                axis: (x: 0, y: 1, z: 0),
                perspective: 0.48
            )
            .scaleEffect(
                isDragging && !reduceMotion
                    ? 1.045
                    : (isBreathing && !reduceMotion ? 1.012 : 1)
            )
            .scaleEffect(hasMadeEntrance || reduceMotion ? 1 : 0.76)
            .opacity(hasMadeEntrance || reduceMotion ? 1 : 0)
            .offset(y: hasMadeEntrance || reduceMotion ? 0 : 34)
            .shadow(
                color: isDragging ? Color.pmOLEDGreen.opacity(0.34) : Color.black.opacity(0.58),
                radius: isDragging ? 32 : 20,
                y: isDragging ? 0 : 14
            )
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

    private var productComposite: some View {
        GeometryReader { proxy in
            let side = min(proxy.size.width, proxy.size.height)

            ZStack {
                turntableFrame

                MonsterAccessoryOverlay(
                    accessory: accessory,
                    frameIndex: frameIndex
                )
            }
            .frame(width: side, height: side)
            .offset(x: side * frameCenteringOffset)
            .animation(reduceMotion ? nil : .snappy(duration: 0.22), value: accessory)
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
        .transaction { transaction in
            transaction.animation = nil
        }
        .accessibilityHidden(true)
    }

    private var rotationGesture: some Gesture {
        DragGesture(minimumDistance: 4)
            .updating($dragOffset) { value, state, transaction in
                transaction.animation = nil
                state = value.translation.width
            }
            .onChanged { value in
                onInteractionProgress?(
                    reduceMotion ? 0 : max(-1, min(1, value.translation.width / 110))
                )
                if !isDragging {
                    isDragging = true
                    dragOriginFrame = frameIndex
                    dragFrameDelta = 0
                    hasExploredTurntable = true
                    onInteractionChanged?(true)
                    if hapticsEnabled {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    }
                }

                let delta = Int((-value.translation.width / 48).rounded(.towardZero))
                guard delta != dragFrameDelta else { return }
                dragFrameDelta = delta
                setFrame(dragOriginFrame + delta)
            }
            .onEnded { value in
                isDragging = false
                onInteractionChanged?(false)
                withAnimation(reduceMotion ? nil : .spring(response: 0.52, dampingFraction: 0.72)) {
                    onInteractionProgress?(0)
                }

                let projected = value.predictedEndTranslation.width
                if dragFrameDelta == 0, abs(projected) > 44 {
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
                .font(.caption.weight(.bold))
                .foregroundStyle(controlColor.opacity(0.82))
                .frame(width: PMTheme.minimumTapTarget, height: PMTheme.minimumTapTarget)
                .overlay {
                    Rectangle().stroke(PMTheme.hairline, lineWidth: 1)
                }
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

    private var frameCenteringOffset: CGFloat {
        // The sprite frames have slightly different transparent bounds. These
        // calibrated values keep the visible creature centered as it turns.
        let offsets: [CGFloat] = [-0.064, -0.040, -0.053, -0.042, -0.060, -0.030, -0.021, -0.026]
        return offsets[frameIndex]
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
