'use strict'

class WebAudioFontChannel {
	audioContext: AudioContext;
	input: GainNode;
	band32: BiquadFilterNode;
	band64: BiquadFilterNode;
	band128: BiquadFilterNode;
	band256: BiquadFilterNode;
	band512: BiquadFilterNode;
	band1k: BiquadFilterNode;
	band2k: BiquadFilterNode;
	band4k: BiquadFilterNode;
	band8k: BiquadFilterNode;
	band16k: BiquadFilterNode;
	output: GainNode;
	constructor(audioContext: AudioContext) {
		this.audioContext = audioContext;
		this.input = audioContext.createGain();
		this.band32 = this.bandEqualizer(this.input, 32);
		this.band64 = this.bandEqualizer(this.band32, 64);
		this.band128 = this.bandEqualizer(this.band64, 128);
		this.band256 = this.bandEqualizer(this.band128, 256);
		this.band512 = this.bandEqualizer(this.band256, 512);
		this.band1k = this.bandEqualizer(this.band512, 1024);
		this.band2k = this.bandEqualizer(this.band1k, 2048);
		this.band4k = this.bandEqualizer(this.band2k, 4096);
		this.band8k = this.bandEqualizer(this.band4k, 8192);
		this.band16k = this.bandEqualizer(this.band8k, 16384);
		this.output = audioContext.createGain();
		this.band16k.connect(this.output);
	}
	bandEqualizer(from: AudioNode, frequency: number): BiquadFilterNode {
		var filter: BiquadFilterNode = this.audioContext.createBiquadFilter();
		filter.frequency.setTargetAtTime(frequency, 0, 0.0001);
		filter.type = "peaking";
		filter.gain.setTargetAtTime(0, 0, 0.0001);
		filter.Q.setTargetAtTime(1.0, 0, 0.0001);
		from.connect(filter);
		return filter;
	};
}
