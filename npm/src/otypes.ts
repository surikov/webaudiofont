type WaveEnvelope = {
	audioBufferSourceNode?: AudioBufferSourceNode | null
	, target: AudioNode
	, when: number
	, duration: number
	, cancel: () => void
	, pitch: number
	, preset: WavePreset
};
type WaveZone = {
	keyRangeLow: number
	, keyRangeHigh: number
	, originalPitch: number
	, coarseTune: number
	, fineTune: number
	, loopStart: number
	, loopEnd: number
	, buffer?: AudioBuffer
	, sampleRate: number
	, delay?: number
	, ahdsr?: boolean | WaveAHDSR[]
	, sample?: string
	, file?: string
	, sustain?: number
};
type WavePreset = {
	zones: WaveZone[];
};
type WaveSlide = {
	when: number
	, pitch: number
};
type WaveAHDSR = {
	duration: number
	, volume: number
};
type CachedPreset = {
	variableName: string
	, filePath: string
};
type NumPair = number[];
type PresetInfo = {
	variable: string
	, url: string
	, title: string
	, pitch: number
};
type ChordQueue = {
	when: number
	, destination: AudioNode
	, preset: WavePreset
	, pitch: number
	, duration: number
	, volume?: number
	, slides?: WaveSlide[]
};
