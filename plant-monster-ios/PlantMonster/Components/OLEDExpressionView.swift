import SwiftUI

struct OLEDExpressionView: View {
    let expression: PlantExpression
    var width: CGFloat = 168

    var body: some View {
        Image(expression.assetName)
            .resizable()
            .interpolation(.none)
            .colorMultiply(.pmOLEDGreen)
            .scaledToFit()
            .padding(.horizontal, 13)
            .padding(.vertical, 10)
            .frame(width: width, height: width * 0.56)
            .background(Color.pmSmokedGlass)
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(Color.white.opacity(0.18), lineWidth: 1)
            }
            .shadow(color: .black.opacity(0.22), radius: 22, y: 12)
            .accessibilityLabel(expression.accessibilityLabel)
    }
}
