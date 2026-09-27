import SwiftUI

struct SensorReadingView: View {
    @ScaledMetric(relativeTo: .largeTitle) private var valueSize: CGFloat = 42
    let value: String
    let label: LocalizedStringKey
    let systemImage: String
    let status: LocalizedStringKey
    var needsAttention = false

    var body: some View {
        ZStack(alignment: .topTrailing) {
            LinearGradient(
                colors: [
                    Color.pmSmokedGlass.opacity(0.94),
                    Color.pmAubergine.opacity(needsAttention ? 0.9 : 0.7)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Image(systemName: systemImage)
                .font(.system(size: 94, weight: .ultraLight))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(Color.pmBone.opacity(0.09))
                .offset(x: 22, y: -4)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 8) {
                    Image(systemName: systemImage)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(needsAttention ? Color.pmOLEDGreen : Color.pmBone.opacity(0.82))
                        .frame(width: 34, height: 34)
                        .background(
                            Circle().fill(
                                needsAttention
                                    ? Color.pmOLEDGreen.opacity(0.16)
                                    : Color.pmBone.opacity(0.09)
                            )
                        )
                        .accessibilityHidden(true)

                    Spacer(minLength: 0)

                    HStack(spacing: 6) {
                        Circle()
                            .fill(needsAttention ? Color.pmOLEDGreen : Color.pmBone.opacity(0.5))
                            .frame(width: 6, height: 6)
                        Text(status)
                            .font(.caption2.weight(.semibold))
                            .lineLimit(1)
                    }
                    .foregroundStyle(needsAttention ? Color.pmOLEDGreen : Color.pmBone.opacity(0.62))
                }

                Spacer(minLength: 22)

                Text(value)
                    .font(.system(size: valueSize, weight: .medium, design: .rounded))
                    .tracking(-0.8)
                    .foregroundStyle(Color.pmBone)
                    .monospacedDigit()
                    .minimumScaleFactor(0.72)
                    .lineLimit(1)

                Text(label)
                    .font(.caption.weight(.semibold))
                    .tracking(0.72)
                    .foregroundStyle(Color.pmBone.opacity(0.62))
                    .lineLimit(2)
                    .padding(.top, 5)

                HStack(spacing: 5) {
                    ForEach(0..<4, id: \.self) { index in
                        Capsule()
                            .fill(
                                index == 0
                                    ? (needsAttention ? Color.pmOLEDGreen : Color.pmBone.opacity(0.62))
                                    : Color.pmBone.opacity(0.14)
                            )
                            .frame(width: index == 0 ? 28 : 7, height: 3)
                    }
                }
                .padding(.top, 18)
            }
            .padding(18)
        }
        .frame(maxWidth: .infinity, minHeight: 190, alignment: .topLeading)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(
                    needsAttention ? Color.pmOLEDGreen.opacity(0.26) : Color.pmBone.opacity(0.12),
                    lineWidth: 1
                )
        }
        .shadow(color: .black.opacity(0.14), radius: 20, y: 12)
        .accessibilityElement(children: .combine)
    }
}
