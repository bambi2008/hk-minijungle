import SwiftUI

enum MonsterAccessory: String, CaseIterable, Identifiable, Equatable {
    case none
    case sunglasses

    var id: String { rawValue }

    var titleKey: LocalizedStringKey {
        switch self {
        case .none: "companion.wardrobe.none"
        case .sunglasses: "companion.wardrobe.sunglasses"
        }
    }

    var symbolName: String {
        switch self {
        case .none: "circle.slash"
        case .sunglasses: "sunglasses.fill"
        }
    }
}

struct MonsterAccessoryOverlay: View {
    let accessory: MonsterAccessory
    let frameIndex: Int

    var body: some View {
        GeometryReader { proxy in
            let side = min(proxy.size.width, proxy.size.height)

            if accessory == .sunglasses, pose.opacity > 0 {
                accessoryGraphic(side: side)
                    .position(
                        x: side * (0.5 + pose.x),
                        y: side * (0.465 + pose.y)
                    )
                    .opacity(pose.opacity)
                    .transition(.scale(scale: 0.72).combined(with: .opacity))
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    @ViewBuilder
    private func accessoryGraphic(side: CGFloat) -> some View {
        if frameIndex == 2 || frameIndex == 6 {
            let direction: CGFloat = frameIndex == 2 ? 1 : -1

            ZStack {
                Capsule()
                    .fill(Color.black.opacity(0.92))
                    .frame(width: side * 0.105, height: max(1.5, side * 0.006))
                    .offset(x: direction * side * 0.046, y: -side * 0.026)

                RoundedRectangle(cornerRadius: side * 0.022, style: .continuous)
                    .fill(lensGradient)
                    .frame(width: side * 0.050, height: side * 0.102)
                    .overlay(alignment: .top) {
                        Capsule()
                            .fill(Color.white.opacity(0.34))
                            .frame(width: side * 0.026, height: max(1, side * 0.003))
                            .padding(.top, side * 0.012)
                    }
            }
            .rotationEffect(.degrees(pose.roll))
            .shadow(color: Color.black.opacity(0.80), radius: side * 0.012, y: side * 0.009)
        } else {
            Image(systemName: accessory.symbolName)
                .resizable()
                .scaledToFit()
                .symbolRenderingMode(.monochrome)
                .foregroundStyle(lensGradient)
                .frame(width: side * 0.34, height: side * 0.12)
                .scaleEffect(x: pose.horizontalScale, y: pose.verticalScale)
                .rotation3DEffect(
                    .degrees(pose.yaw),
                    axis: (x: 0, y: 1, z: 0),
                    perspective: 0.5
                )
                .rotationEffect(.degrees(pose.roll))
                .shadow(color: Color.black.opacity(0.82), radius: side * 0.018, y: side * 0.012)
                .overlay(alignment: .top) {
                    Capsule()
                        .fill(Color.white.opacity(0.32))
                        .frame(width: side * 0.13, height: 1)
                        .offset(x: -side * 0.055, y: side * 0.025)
                }
        }
    }

    private var lensGradient: LinearGradient {
        LinearGradient(
            colors: [
                Color.black,
                Color.pmAubergine.opacity(0.94),
                Color.black
            ],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    private var pose: AccessoryPose {
        switch frameIndex {
        // Each pose is registered to the visible glass in the corresponding
        // turntable render. Side views need a much larger horizontal travel
        // than a generic 3D transform because the front glass moves to the
        // outer silhouette of the product as the body turns.
        case 0: AccessoryPose(x: -0.010, y: -0.004, horizontalScale: 1, verticalScale: 1, yaw: 0, roll: 0, opacity: 1)
        case 1: AccessoryPose(x: -0.062, y: -0.006, horizontalScale: 0.92, verticalScale: 0.98, yaw: -18, roll: -1.5, opacity: 0.98)
        case 2: AccessoryPose(x: -0.238, y: -0.002, horizontalScale: 0.50, verticalScale: 0.92, yaw: -60, roll: -2.5, opacity: 0.90)
        case 6: AccessoryPose(x: 0.228, y: -0.002, horizontalScale: 0.50, verticalScale: 0.92, yaw: 60, roll: 2.5, opacity: 0.90)
        case 7: AccessoryPose(x: 0.070, y: -0.006, horizontalScale: 0.92, verticalScale: 0.98, yaw: 18, roll: 1.5, opacity: 0.98)
        default: .hidden
        }
    }
}

private struct AccessoryPose {
    let x: CGFloat
    let y: CGFloat
    let horizontalScale: CGFloat
    let verticalScale: CGFloat
    let yaw: Double
    let roll: Double
    let opacity: Double

    static let hidden = AccessoryPose(
        x: 0,
        y: 0,
        horizontalScale: 0,
        verticalScale: 0,
        yaw: 0,
        roll: 0,
        opacity: 0
    )
}
