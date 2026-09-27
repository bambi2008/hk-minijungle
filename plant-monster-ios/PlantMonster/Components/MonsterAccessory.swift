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
                Image(systemName: accessory.symbolName)
                    .resizable()
                    .scaledToFit()
                    .symbolRenderingMode(.monochrome)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [
                                Color.black,
                                Color.pmAubergine.opacity(0.94),
                                Color.black
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: side * 0.34, height: side * 0.12)
                    .scaleEffect(x: pose.horizontalScale, y: 1)
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

    private var pose: AccessoryPose {
        switch frameIndex {
        case 0: AccessoryPose(x: -0.018, y: 0, horizontalScale: 1, yaw: 0, roll: 0, opacity: 1)
        case 1: AccessoryPose(x: -0.07, y: -0.004, horizontalScale: 0.72, yaw: -38, roll: -2, opacity: 0.96)
        case 2: AccessoryPose(x: -0.12, y: 0.002, horizontalScale: 0.28, yaw: -68, roll: -3, opacity: 0.62)
        case 6: AccessoryPose(x: 0.105, y: 0.002, horizontalScale: 0.28, yaw: 68, roll: 3, opacity: 0.62)
        case 7: AccessoryPose(x: 0.058, y: -0.004, horizontalScale: 0.72, yaw: 38, roll: 2, opacity: 0.96)
        default: .hidden
        }
    }
}

private struct AccessoryPose {
    let x: CGFloat
    let y: CGFloat
    let horizontalScale: CGFloat
    let yaw: Double
    let roll: Double
    let opacity: Double

    static let hidden = AccessoryPose(
        x: 0,
        y: 0,
        horizontalScale: 0,
        yaw: 0,
        roll: 0,
        opacity: 0
    )
}
