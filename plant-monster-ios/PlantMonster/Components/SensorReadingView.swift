import SwiftUI

struct SensorReadingView: View {
    let value: String
    let label: LocalizedStringKey

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(value)
                .font(.system(.title3, design: .monospaced, weight: .medium))
                .foregroundStyle(Color.pmAubergine)
                .monospacedDigit()
            Text(label)
                .font(.caption)
                .foregroundStyle(Color.pmAubergine.opacity(0.68))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

