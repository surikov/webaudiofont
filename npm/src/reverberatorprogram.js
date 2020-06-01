'use strict'
console.log('WebAudioFont Reverberator v1.10 GPL3');
function WebAudioFontReverberator(audioContext) {
	//https://www.deeptronic.com/electronic-circuit-design/diy-reverb-pedal-circuit-from-spring-to-room-like-reverb-using-multiple-pt2399-ic-chips/
	var me = this;
	this.audioContext = audioContext;
	this.input = this.audioContext.createBiquadFilter();
	this.input.type = "lowpass";
	this.input.frequency.setTargetAtTime(18000,0,0.0001);
	this.output = audioContext.createGain();
	this.decay = audioContext.createGain();
	this.decay.gain.setTargetAtTime(0.5,0,0.0001);
	this.roomSize = audioContext.createDelay(0.34);
	this.delay1 = audioContext.createDelay(0.031);
	this.delay2 = audioContext.createDelay(0.075);
	this.delay3 = audioContext.createDelay(0.113);
	this.delay4 = audioContext.createDelay(0.196);
	this.dry = audioContext.createGain();
	this.dry.gain.setTargetAtTime(0.9,0,0.0001);
	this.dry.connect(this.output);
	this.wet = audioContext.createGain();
	this.wet.gain.setTargetAtTime(0.5,0,0.0001);
	this.input.connect(me.roomSize);
	this.roomSize.connect(me.delay1);
	this.roomSize.connect(me.delay2);
	this.roomSize.connect(me.delay3);
	this.roomSize.connect(me.delay4);
	this.delay1.connect(me.decay);
	this.delay2.connect(me.decay);
	this.delay3.connect(me.decay);
	this.delay4.connect(me.decay);
	this.decay.connect(me.roomSize);
	this.delay1.connect(me.wet);
	this.delay2.connect(me.wet);
	this.delay3.connect(me.wet);
	this.delay4.connect(me.wet);
	this.wet.connect(me.output);
	this.input.connect(this.dry);
	return this;
}
if (typeof module === 'object' && module.exports) {
	module.exports = WebAudioFontReverberator;
}
if (typeof window !== 'undefined') {
	window.WebAudioFontReverberator = WebAudioFontReverberator;
}
