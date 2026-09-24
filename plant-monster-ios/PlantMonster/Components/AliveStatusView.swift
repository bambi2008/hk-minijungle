import SwiftUI

struct AliveStatusView: View {
    let text: String
    var foregroundColor: Color = .pmBone

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(Color.pmOLEDGreen)
                .frame(width: 8, height: 8)
                .shadow(color: .pmOLEDGreen.opacity(0.65), radius: 5)
                .accessibilityHidden(true)
            Text(text.uppercased())
                .font(.caption.weight(.semibold))
                .tracking(1.2)
        }
        .foregroundStyle(foregroundColor)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(text)
    }
}

