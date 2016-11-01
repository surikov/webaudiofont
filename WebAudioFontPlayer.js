console.log('WebAudioFont Player v1.18');
function WebAudioFontPlayer() {
	this.envelopes = [];
	this.afterTime = 0.1;
	this.nearZero = 0.000001;
	this.queueWaveTable = function (audioContext, target, preset, when, pitch, duration, continuous) {
		var zone = this.findZone(audioContext, preset, pitch);
		if (!continuous) {
			continuous = !(zone.ahdsr);
		}
		var baseDetune = zone.originalPitch - 100.0 * zone.coarseTune - zone.fineTune;
		var playbackRate = 1.0 * Math.pow(2, (100.0 * pitch - baseDetune) / 1200.0);
		var sampleRatio = zone.sampleRate / audioContext.sampleRate;
		var startWhen = when;
		if (when < audioContext.currentTime) {
			startWhen = audioContext.currentTime;
		}
		var waveDuration = duration + this.afterTime;
		if (zone.loopStart < 10 || zone.loopStart >= zone.loopEnd) {
			if (waveDuration > zone.buffer.duration / playbackRate) {
				waveDuration = zone.buffer.duration / playbackRate;
			}
		}
		var envelope = this.findEnvelope(audioContext, target, startWhen, waveDuration);
		envelope.gain.setValueAtTime(0, this.nearZero);
		envelope.gain.setValueAtTime(startWhen, this.nearZero);
		var a = 0.005;
		var h = 0.25;
		var d = 0.75;
		var s = 5.1;
		envelope.gain.exponentialRampToValueAtTime(1, startWhen + a);
		if (waveDuration < h) {
			envelope.gain.linearRampToValueAtTime(1, startWhen + 7 * waveDuration / 8 - a);
		} else {
			if (continuous) {
				envelope.gain.linearRampToValueAtTime(1, startWhen + waveDuration - this.afterTime);
			} else {
				if (waveDuration + this.afterTime < d) {
					envelope.gain.linearRampToValueAtTime(0.3, startWhen + waveDuration - this.afterTime);
				} else {
					envelope.gain.linearRampToValueAtTime(0.3, startWhen + d - this.afterTime);
					if (waveDuration < s) {
						envelope.gain.linearRampToValueAtTime(0.1, startWhen + waveDuration - this.afterTime);
					} else {
						envelope.gain.linearRampToValueAtTime(this.nearZero, startWhen + waveDuration - this.afterTime);
					}
				}
			}
		}
		envelope.gain.exponentialRampToValueAtTime(this.nearZero, startWhen + waveDuration);
		envelope.audioBufferSourceNode = audioContext.createBufferSource();
		envelope.audioBufferSourceNode.playbackRate.value = playbackRate;
		if (zone.buffer) {
			envelope.audioBufferSourceNode.buffer = zone.buffer;
		} else {
			console.log('empty buffer ', zone);
		}
		if (zone.loopStart > 10 && zone.loopStart < zone.loopEnd) {
			envelope.audioBufferSourceNode.loop = true;
			envelope.audioBufferSourceNode.loopStart = zone.loopStart / zone.sampleRate;
			envelope.audioBufferSourceNode.loopEnd = zone.loopEnd / zone.sampleRate;
		} else {
			envelope.audioBufferSourceNode.loop = false;
		}
		envelope.audioBufferSourceNode.connect(envelope);
		envelope.audioBufferSourceNode.start(startWhen);
		envelope.audioBufferSourceNode.stop(startWhen + waveDuration);
		envelope.when = startWhen;
		envelope.duration = waveDuration+0.1;
		envelope.pitch = pitch;
		envelope.preset = preset;
		return envelope;
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
	this.adjustPreset = function (preset) {
		for (var i = 0; i < preset.zones.length; i++) {
			this.adjustZone(preset.zones[i]);
		}
	};
	this.adjustZone = function (zone) {
		if (zone.buffer) {
			//
		} else {
			if (zone.sample) {
				zone.buffer = audioContext.createBuffer(1, zone.sample.length, zone.sampleRate);
				var float32Array = zone.buffer.getChannelData(0);
				for (var i = 0; i < zone.sample.length; i++) {
					float32Array[i] = zone.sample[i] / 65536.0;
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
			if (zone.keyRangeLow <= pitch && zone.keyRangeHigh >= pitch) {
				break;
			}
		}
		this.adjustZone(zone);
		return zone;
	};
	this.cancelQueue = function (audioContext) {
		for (var i = 0; i < this.envelopes.length; i++) {
			var e = this.envelopes[i];
			e.gain.cancelScheduledValues(0);
			e.gain.setValueAtTime(this.nearZero, audioContext.currentTime);
			e.when = -1;
		}
	};
	return this;
}
