import Foundation

enum PlantExpression: String, CaseIterable, Sendable {
    case idleMean = "G00"
    case sunComfy = "G02"
    case findLight = "G03"
    case tooBright = "G04"
    case sleep = "G05"
    case cold = "G06"
    case hot = "G07"
    case thirsty = "G10"
    case watered = "G11"
    case pickup = "M01"
    case dizzy = "M03"
    case wink = "T01"
    case pet = "T02"
    case annoyed = "T04"
    case pollination = "P03"

    init?(firmwareCode: String) {
        self.init(rawValue: firmwareCode.uppercased())
    }

    var assetName: String {
        switch self {
        case .idleMean: "expression-idle-mean"
        case .sunComfy: "expression-sun-comfy"
        case .findLight: "expression-find-light"
        case .tooBright: "expression-too-bright"
        case .sleep: "expression-sleep"
        case .cold: "expression-cold"
        case .hot: "expression-hot"
        case .thirsty: "expression-thirsty"
        case .watered: "expression-watered"
        case .pickup: "expression-pickup"
        case .dizzy: "expression-dizzy"
        case .wink: "expression-wink"
        case .pet: "expression-pet"
        case .annoyed: "expression-annoyed"
        case .pollination: "expression-pollination"
        }
    }

    var accessibilityLabel: String {
        switch self {
        case .idleMean: String(localized: "expression.idle")
        case .sunComfy: String(localized: "expression.comfortable")
        case .findLight: String(localized: "expression.findLight")
        case .tooBright: String(localized: "expression.tooBright")
        case .sleep: String(localized: "expression.sleeping")
        case .cold: String(localized: "expression.cold")
        case .hot: String(localized: "expression.hot")
        case .thirsty: String(localized: "expression.thirsty")
        case .watered: String(localized: "expression.watered")
        case .pickup: String(localized: "expression.pickedUp")
        case .dizzy: String(localized: "expression.dizzy")
        case .wink: String(localized: "expression.winking")
        case .pet: String(localized: "expression.enjoyingTouch")
        case .annoyed: String(localized: "expression.annoyed")
        case .pollination: String(localized: "expression.pollinating")
        }
    }
}

