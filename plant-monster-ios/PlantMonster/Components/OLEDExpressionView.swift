import SwiftUI

struct OLEDExpressionView: View {
    let expression: PlantExpression
    var width: CGFloat = 168
    var tint: Color = .white
    var isActive = false

    var body: some View {
        Image(expression.assetName)
            .resizable()
            .interpolation(.none)
            .colorMultiply(tint)
            .scaledToFit()
            .padding(.horizontal, width * 0.075)
            .padding(.vertical, width * 0.055)
            .frame(width: width, height: width * 0.56)
            .background(Color.black.opacity(0.94))
            .overlay {
                Rectangle()
                    .stroke(isActive ? Color.pmOLEDGreen.opacity(0.76) : Color.white.opacity(0.62), lineWidth: 1)
            }
            .shadow(color: isActive ? Color.pmOLEDGreen.opacity(0.28) : .black.opacity(0.5), radius: 24)
            .accessibilityLabel(expression.accessibilityLabel)
    }
}
