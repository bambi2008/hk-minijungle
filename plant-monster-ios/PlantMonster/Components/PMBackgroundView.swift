import SwiftUI

struct PMBackgroundView: View {
    var body: some View {
        Image("botanical-background")
            .resizable()
            .scaledToFill()
            .overlay(Color.pmSage.opacity(0.34))
            .ignoresSafeArea()
            .accessibilityHidden(true)
    }
}

