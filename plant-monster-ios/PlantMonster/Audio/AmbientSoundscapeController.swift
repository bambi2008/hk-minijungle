import AVFoundation
import Combine
import Foundation

@MainActor
final class AmbientSoundscapeController: ObservableObject {
    @Published private(set) var isPlaying = false

    private final class RenderState: @unchecked Sendable {
        var phase1 = 0.0
        var phase2 = 0.0
        var phase3 = 0.0
        var phase4 = 0.0
        var shimmerPhase = 0.0
        var breathPhase = 0.0
        var stereoPhase = 0.0
        var gain = 0.0
    }

    private var engine: AVAudioEngine?
    private var sourceNode: AVAudioSourceNode?

    func setEnabled(_ enabled: Bool) {
        enabled ? start() : stop()
    }

    func start() {
        guard !isPlaying else { return }

        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)

            let sampleRate = 48_000.0
            guard let format = AVAudioFormat(
                standardFormatWithSampleRate: sampleRate,
                channels: 2
            ) else { return }

            let renderState = RenderState()
            let sourceNode = AVAudioSourceNode(format: format) { _, _, frameCount, audioBufferList in
                let buffers = UnsafeMutableAudioBufferListPointer(audioBufferList)
                let twoPi = Double.pi * 2

                for frame in 0..<Int(frameCount) {
                    renderState.gain += (1 - renderState.gain) * 0.00004

                    let breath = 0.68 + 0.32 * sin(renderState.breathPhase)
                    let shimmer = 0.5 + 0.5 * sin(renderState.shimmerPhase)
                    let base = sin(renderState.phase1) * 0.032
                    let fifth = sin(renderState.phase2) * 0.018
                    let octave = sin(renderState.phase3) * 0.010
                    let air = sin(renderState.phase4) * shimmer * 0.004
                    let sample = Float((base + fifth + octave + air) * breath * renderState.gain)
                    let stereoDrift = Float(sin(renderState.stereoPhase) * 0.055)

                    for (channel, buffer) in buffers.enumerated() {
                        guard let data = buffer.mData?.assumingMemoryBound(to: Float.self) else { continue }
                        data[frame] = sample * (channel == 0 ? 0.94 + stereoDrift : 0.94 - stereoDrift)
                    }

                    renderState.phase1.formTruncatingRemainder(dividingBy: twoPi)
                    renderState.phase2.formTruncatingRemainder(dividingBy: twoPi)
                    renderState.phase3.formTruncatingRemainder(dividingBy: twoPi)
                    renderState.phase4.formTruncatingRemainder(dividingBy: twoPi)
                    renderState.shimmerPhase.formTruncatingRemainder(dividingBy: twoPi)
                    renderState.breathPhase.formTruncatingRemainder(dividingBy: twoPi)
                    renderState.stereoPhase.formTruncatingRemainder(dividingBy: twoPi)

                    renderState.phase1 += twoPi * 130.813 / sampleRate
                    renderState.phase2 += twoPi * 155.563 / sampleRate
                    renderState.phase3 += twoPi * 195.998 / sampleRate
                    renderState.phase4 += twoPi * 523.251 / sampleRate
                    renderState.shimmerPhase += twoPi * 0.071 / sampleRate
                    renderState.breathPhase += twoPi * 0.043 / sampleRate
                    renderState.stereoPhase += twoPi * 0.029 / sampleRate
                }

                return noErr
            }

            let engine = AVAudioEngine()
            engine.attach(sourceNode)
            engine.connect(sourceNode, to: engine.mainMixerNode, format: format)
            engine.prepare()
            try engine.start()

            self.engine = engine
            self.sourceNode = sourceNode
            isPlaying = true
        } catch {
            engine = nil
            sourceNode = nil
            isPlaying = false
        }
    }

    func stop() {
        guard engine != nil || isPlaying else { return }
        engine?.stop()
        engine = nil
        sourceNode = nil
        isPlaying = false
        try? AVAudioSession.sharedInstance().setActive(
            false,
            options: .notifyOthersOnDeactivation
        )
    }
}
