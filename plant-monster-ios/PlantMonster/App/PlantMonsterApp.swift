import SwiftUI

@main
struct PlantMonsterApp: App {
    @StateObject private var model = AppModel(client: PlantMonsterBLEClientFactory.makeDefault())
    @StateObject private var soundscape = AmbientSoundscapeController()

    var body: some Scene {
        WindowGroup {
            AppRootView()
                .environmentObject(model)
                .environmentObject(soundscape)
                .tint(.pmOLEDGreen)
        }
    }
}
