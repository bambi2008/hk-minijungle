import SwiftUI

struct SensorReadingView: View {
    let value: String
    let label: LocalizedStringKey
    let systemImage: String
    let status: LocalizedStringKey
    var needsAttention = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: systemImage)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(needsAttention ? Color.pmOLEDGreen : Color.pmBone.opacity(0.82))
                    .frame(width: 34, height: 34)
                    .background(
                        Circle()
                            .fill(
                                needsAttention
                                    ? Color.pmOLEDGreen.opacity(0.14)
                                    : Color.pmBone.opacity(0.08)
                            )
                    )
                    .accessibilityHidden(true)

                Spacer(minLength: 0)

                HStack(spacing: 5) {
                    Circle()
                        .fill(needsAttention ? Color.pmOLEDGreen : Color.pmBone.opacity(0.46))
                        .frame(width: 5, height: 5)
                    Text(status)
                        .font(.caption2.weight(.medium))
                        .lineLimit(1)
                }
                .foregroundStyle(needsAttention ? Color.pmOLEDGreen : Color.pmBone.opacity(0.58))
            }

            VStack(alignment: .leading, spacing: 5) {
                Text(value)
                    .font(.system(.title2, design: .rounded, weight: .medium))
                    .foregroundStyle(Color.pmBone)
                    .monospacedDigit()
                    .minimumScaleFactor(0.82)
                Text(label)
                    .font(.caption)
                    .foregroundStyle(Color.pmBone.opacity(0.62))
                    .lineLimit(2)
            }
        }
        .frame(maxWidth: .infinity, minHeight: 112, alignment: .topLeading)
        .padding(16)
        .background(
            LinearGradient(
                colors: [
                    Color.pmSmokedGlass.opacity(0.84),
                    Color.pmAubergine.opacity(0.62)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.pmBone.opacity(0.12), lineWidth: 1)
        }
        .accessibilityElement(children: .combine)
    }
}
