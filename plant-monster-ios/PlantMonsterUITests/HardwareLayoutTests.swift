import XCTest

final class HardwareLayoutTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testPairingControlsStayInsidePhone() {
        let app = XCUIApplication()
        app.launchArguments = ["-plantMonster.hasCompletedPairing", "NO", "-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN"]
        app.launch()
        let title = app.staticTexts["pairing.title"]
        let connect = app.buttons["pairing.connect"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        XCTAssertTrue(connect.waitForExistence(timeout: 10))
        for frame in [title.frame, connect.frame] {
            XCTAssertGreaterThanOrEqual(frame.minX, app.frame.minX + 20)
            XCTAssertLessThanOrEqual(frame.maxX, app.frame.maxX - 20)
        }
        XCTAssertTrue(connect.isHittable)
    }

    func testFeelingEvidenceAndTouchRemainInteractive() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-narrative", "-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        app.launch()
        let evidence = app.buttons["companion.evidence"]
        XCTAssertTrue(evidence.waitForExistence(timeout: 10))
        XCTAssertTrue(evidence.isHittable)
        evidence.tap()
        XCTAssertEqual(evidence.value as? String, "Sensor evidence expanded")
        evidence.tap()
        XCTAssertEqual(evidence.value as? String, "Sensor evidence collapsed")
        let touch = app.buttons["companion.touch"]
        XCTAssertTrue(touch.isHittable)
        touch.tap()
        XCTAssertTrue(app.staticTexts["companion.feeling"].exists)
    }
}
