(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'
console.log('WebAudioFont Channel v1.01');
function WebAudioFontChannel(audioContext) {
	this.audioContext = audioContext;
	this.bandEqualizer = function (from, frequency) {
		var filter = this.audioContext.createBiquadFilter();
		filter.frequency.value = frequency;
		filter.type = "peaking";
		filter.gain.value = 0;
		filter.Q.value = 1.0;
		from.connect(filter);
		return filter;
	};
	this.input = this.audioContext.createDynamicsCompressor();
	this.input.threshold.value = -3; //-50
	this.input.knee.value = 30; //40
	this.input.ratio.value = 12; //12
	//this.input.reduction.value = -20; //-20
	this.input.attack.value = 0.05; //0
	this.input.release.value = 0.08; //0.25
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
	return this;
}
if (typeof module === 'object' && module.exports) {
	module.exports = WebAudioFontChannel;
}
if (typeof window !== 'undefined') {
	window.WebAudioFontChannel = WebAudioFontChannel;
}

},{}],2:[function(require,module,exports){
'use strict'
console.log('WebAudioFont Loader v1.06');
function WebAudioFontLoader(player) {
	this.player = player;
	this.cached = [];
	this.startLoad = function (audioContext, filePath, variableName) {
		if (window[variableName]) {
			return;
		}
		for (var i = 0; i < this.cached.length; i++) {
			if (this.cached[i].variableName == variableName) {
				return;
			}
		}
		this.cached.push({
			filePath : filePath,
			variableName : variableName
		});
		var r = document.createElement('script');
		r.setAttribute("type", "text/javascript");
		r.setAttribute("src", filePath);
		document.getElementsByTagName("head")[0].appendChild(r);
		this.decodeAfterLoading(audioContext,variableName);
	};
	this.decodeAfterLoading = function (audioContext,variableName) {
		var me = this;
		this.waitOrFinish(variableName, function () {
			me.player.adjustPreset(audioContext, window[variableName]);
		});
	};
	this.waitOrFinish = function (variableName, onFinish) {
		if (window[variableName]) {
			onFinish();
		} else {
			var me = this;
			setTimeout(function () {
				me.waitOrFinish(variableName, onFinish);
			}, 111);
		}
	};
	this.loaded = function (variableName) {
		if (!(window[variableName])) {
			return false;
		}
		var preset = window[variableName];
		for (var i = 0; i < preset.zones.length; i++) {
			if (!(preset.zones[i].buffer)) {
				return false;
			}
		}
		return true;
	};
	this.progress = function () {
		if (this.cached.length > 0) {
			for (var k = 0; k < this.cached.length; k++) {
				if (!this.loaded(this.cached[k].variableName)) {
					return k / this.cached.length;
				}
			}
			return 1;
		} else {
			return 1;
		}
	};
	this.waitLoad = function (onFinish) {
		var me = this;
		if (this.progress() >= 1) {
			onFinish();
		} else {
			setTimeout(function () {
				me.waitLoad(onFinish);
			}, 333);
		}
	};
	return this;
}
if (typeof module === 'object' && module.exports) {
	module.exports = WebAudioFontLoader;
}
if (typeof window !== 'undefined') {
	window.WebAudioFontLoader = WebAudioFontLoader;
}

},{}],3:[function(require,module,exports){
'use strict'
console.log('WebAudioFont Player v2.64');
var WebAudioFontLoader = require('./loader');
var WebAudioFontChannel = require('./channel');
var WebAudioFontReverberator = require('./reverberator')
function WebAudioFontPlayer() {
	this.envelopes = [];
	this.loader = new WebAudioFontLoader(this);
	this.onCacheFinish = null;
	this.onCacheProgress = null;
	this.afterTime = 0.05;
	this.nearZero = 0.000001;
	this.queueWaveTable = function (audioContext, target, preset, when, pitch, duration, volume, slides) {
		if (volume) {
			volume = 1.0 * volume;
		} else {
			volume = 1.0;
		}
		var zone = this.findZone(audioContext, preset, pitch);
		if (!(zone.buffer)) {
			console.log('empty buffer ', zone);
			return;
		}
		var baseDetune = zone.originalPitch - 100.0 * zone.coarseTune - zone.fineTune;
		var playbackRate = 1.0 * Math.pow(2, (100.0 * pitch - baseDetune) / 1200.0);
		var sampleRatio = zone.sampleRate / audioContext.sampleRate;
		var startWhen = when;
		if (startWhen < audioContext.currentTime) {
			startWhen = audioContext.currentTime;
		}
		var waveDuration = duration + this.afterTime;
		var loop = true;
		if (zone.loopStart < 1 || zone.loopStart >= zone.loopEnd) {
			loop = false;
		}
		if (!loop) {
			if (waveDuration > zone.buffer.duration / playbackRate) {
				waveDuration = zone.buffer.duration / playbackRate;
			}
		}
		var envelope = this.findEnvelope(audioContext, target, startWhen, waveDuration);
		this.setupEnvelope(audioContext, envelope, zone, volume, startWhen, waveDuration, duration);
		envelope.audioBufferSourceNode = audioContext.createBufferSource();
		envelope.audioBufferSourceNode.playbackRate.value = playbackRate;
		if (slides) {
			if (slides.length > 0) {
				envelope.audioBufferSourceNode.playbackRate.setValueAtTime(playbackRate, when);
				for (var i = 0; i < slides.length; i++) {
					var newPlaybackRate = 1.0 * Math.pow(2, (100.0 * slides[i].pitch - baseDetune) / 1200.0);
					var newWhen = when + slides[i].when;
					envelope.audioBufferSourceNode.playbackRate.linearRampToValueAtTime(newPlaybackRate, newWhen);
				}
			}
		}
		envelope.audioBufferSourceNode.buffer = zone.buffer;
		if (loop) {
			envelope.audioBufferSourceNode.loop = true;
			envelope.audioBufferSourceNode.loopStart = zone.loopStart / zone.sampleRate + zone.delay;
			envelope.audioBufferSourceNode.loopEnd = zone.loopEnd / zone.sampleRate + zone.delay;
		} else {
			envelope.audioBufferSourceNode.loop = false;
		}
		envelope.audioBufferSourceNode.connect(envelope);
		envelope.audioBufferSourceNode.start(startWhen, zone.delay);
		envelope.audioBufferSourceNode.stop(startWhen + waveDuration);
		envelope.when = startWhen;
		envelope.duration = waveDuration;
		envelope.pitch = pitch;
		envelope.preset = preset;
		return envelope;
	};
	this.noZeroVolume = function (n) {
		if (n > this.nearZero) {
			return n;
		} else {
			return this.nearZero;
		}
	};
	this.setupEnvelope = function (audioContext, envelope, zone, volume, when, sampleDuration, noteDuration) {
		envelope.gain.setValueAtTime(this.noZeroVolume(0), audioContext.currentTime);
		var lastTime = 0;
		var lastVolume = 0;
		var duration = noteDuration;
		var ahdsr = zone.ahdsr;
		if (sampleDuration < duration + this.afterTime) {
			duration = sampleDuration - this.afterTime;
		}
		if (ahdsr) {
			if (!(ahdsr.length > 0)) {
				ahdsr = [{
						duration : 0,
						volume : 1
					}, {
						duration : 0.5,
						volume : 1
					}, {
						duration : 1.5,
						volume : 0.5
					}, {
						duration : 3,
						volume : 0
					}
				];
			}
		} else {
			ahdsr = [{
					duration : 0,
					volume : 1
				}, {
					duration : duration,
					volume : 1
				}
			];
		}
		envelope.gain.cancelScheduledValues(when);
		envelope.gain.setValueAtTime(this.noZeroVolume(ahdsr[0].volume * volume), when);
		for (var i = 0; i < ahdsr.length; i++) {
			if (ahdsr[i].duration > 0) {
				if (ahdsr[i].duration + lastTime > duration) {
					var r = 1 - (ahdsr[i].duration + lastTime - duration) / ahdsr[i].duration;
					var n = lastVolume - r * (lastVolume - ahdsr[i].volume);
					envelope.gain.linearRampToValueAtTime(this.noZeroVolume(volume * n), when + duration);
					break;
				}
				lastTime = lastTime + ahdsr[i].duration;
				lastVolume = ahdsr[i].volume;
				envelope.gain.linearRampToValueAtTime(this.noZeroVolume(volume * lastVolume), when + lastTime);
			}
		}
		envelope.gain.linearRampToValueAtTime(this.noZeroVolume(0), when + duration + this.afterTime);
	};
	this.numValue = function (aValue, defValue) {
		if (typeof aValue === "number") {
			return aValue;
		} else {
			return defValue;
		}
	};
	this.findEnvelope = function (audioContext, target, when, duration) {
		var envelope = null;
		for (var i = 0; i < this.envelopes.length; i++) {
			var e = this.envelopes[i];
			if (e.target == target && audioContext.currentTime > e.when + e.duration + 0.1) {
				try {
					e.audioBufferSourceNode.disconnect();
					e.audioBufferSourceNode.stop(0);
					e.audioBufferSourceNode = null;
				} catch (x) {
					//audioBufferSourceNode is dead already
				}
				envelope = e;
				break;
			}
		}
		if (!(envelope)) {
			envelope = audioContext.createGain();
			envelope.target = target;
			envelope.connect(target);
			envelope.cancel = function () {
				if (envelope.when + envelope.duration > audioContext.currentTime) {
					envelope.gain.cancelScheduledValues(0);
					envelope.gain.setTargetAtTime(0.00001, audioContext.currentTime, 0.1);
					envelope.when = audioContext.currentTime + 0.00001;
					envelope.duration = 0;
				}
			};
			this.envelopes.push(envelope);
		}
		return envelope;
	};
	this.adjustPreset = function (audioContext, preset) {
		for (var i = 0; i < preset.zones.length; i++) {
			this.adjustZone(audioContext, preset.zones[i]);
		}
	};
	this.adjustZone = function (audioContext, zone) {
		if (zone.buffer) {
			//
		} else {
			zone.delay = 0;
			if (zone.sample) {
				var decoded = atob(zone.sample);
				zone.buffer = audioContext.createBuffer(1, decoded.length / 2, zone.sampleRate);
				var float32Array = zone.buffer.getChannelData(0);
				var b1,
				b2,
				n;
				for (var i = 0; i < decoded.length / 2; i++) {
					b1 = decoded.charCodeAt(i * 2);
					b2 = decoded.charCodeAt(i * 2 + 1);
					if (b1 < 0) {
						b1 = 256 + b1;
					}
					if (b2 < 0) {
						b2 = 256 + b2;
					}
					n = b2 * 256 + b1;
					if (n >= 65536 / 2) {
						n = n - 65536;
					}
					float32Array[i] = n / 65536.0;
				}
			} else {
				if (zone.file) {
					var datalen = zone.file.length;
					var arraybuffer = new ArrayBuffer(datalen);
					var view = new Uint8Array(arraybuffer);
					var decoded = atob(zone.file);
					var b;
					for (var i = 0; i < decoded.length; i++) {
						b = decoded.charCodeAt(i);
						view[i] = b;
					}
					audioContext.decodeAudioData(arraybuffer, function (audioBuffer) {
						zone.buffer = audioBuffer;
					});
				}
			}
			zone.loopStart = this.numValue(zone.loopStart, 0);
			zone.loopEnd = this.numValue(zone.loopEnd, 0);
			zone.coarseTune = this.numValue(zone.coarseTune, 0);
			zone.fineTune = this.numValue(zone.fineTune, 0);
			zone.originalPitch = this.numValue(zone.originalPitch, 6000);
			zone.sampleRate = this.numValue(zone.sampleRate, 44100);
			zone.sustain = this.numValue(zone.originalPitch, 0);
		}
	};
	this.findZone = function (audioContext, preset, pitch) {
		var zone = null;
		for (var i = preset.zones.length - 1; i >= 0; i--) {
			zone = preset.zones[i];
			if (zone.keyRangeLow <= pitch && zone.keyRangeHigh + 1 >= pitch) {
				break;
			}
		}
		try {
			this.adjustZone(audioContext, zone);
		} catch (ex) {
			console.log('adjustZone', ex);
		}
		return zone;
	};
	this.cancelQueue = function (audioContext) {
		for (var i = 0; i < this.envelopes.length; i++) {
			var e = this.envelopes[i];
			e.gain.cancelScheduledValues(0);
			e.gain.setValueAtTime(this.nearZero, audioContext.currentTime);
			e.when = -1;
			try {
				e.audioBufferSourceNode.disconnect();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
	return this;
}
if (typeof module === 'object' && module.exports) {
	module.exports = WebAudioFontPlayer;
}
if (typeof window !== 'undefined') {
	window.WebAudioFontPlayer = WebAudioFontPlayer;
}

},{"./channel":1,"./loader":2,"./reverberator":4}],4:[function(require,module,exports){
'use strict'
console.log('WebAudioFont Reverberator v1.08');
function WebAudioFontReverberator(audioContext) {
	var me = this;
	this.audioContext = audioContext;
	this.input = this.audioContext.createBiquadFilter();
	this.input.type = "lowpass";
	this.input.frequency.value = 18000;
	this.convolver = null;
	this.output = audioContext.createGain();
	this.dry = audioContext.createGain();
	this.dry.gain.value = 0.9;
	this.dry.connect(this.output);
	this.wet = audioContext.createGain();
	this.wet.gain.value = 0.5;
	this.input.connect(this.dry);
	this.input.connect(this.wet);
	var irr="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";//http://www.openairlib.net/
	var datalen = irr.length / 2;
	this.irrArrayBuffer = new ArrayBuffer(datalen);
	var view = new Uint8Array(this.irrArrayBuffer);
	var decoded = atob(irr);
	var b;
	for (var i = 0; i < decoded.length; i++) {
		b = decoded.charCodeAt(i);
		view[i] = b;
	}
	this.audioContext.decodeAudioData(this.irrArrayBuffer, function (audioBuffer) {
		me.convolver = audioContext.createConvolver();
		me.convolver.buffer = audioBuffer;
		me.wet.connect(me.convolver);
		me.convolver.connect(me.output);
		console.log('convolver audioBuffer',audioBuffer);
	});
	return this;
}
if (typeof module === 'object' && module.exports) {
	module.exports = WebAudioFontReverberator;
}
if (typeof window !== 'undefined') {
	window.WebAudioFontReverberator = WebAudioFontReverberator;
}

},{}]},{},[3]);
