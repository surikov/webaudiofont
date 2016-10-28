console.log('WebAudioFont Player v1.07');
function WebAudioFontPlayer() {
	this.envelopes = [];
	this.afterTime = 0.2;
	this.preTime = 0.001;
	this.nearZero = 0.000001;
	this.queueWaveTable = function (audioContext, target, preset, when, pitch, duration, continuous) {
		var zone = this.findZone(audioContext, preset, pitch);
		if (when < audioContext.currentTime + this.preTime) {
			when = audioContext.currentTime + this.preTime;
		}
		var baseDetune = zone.originalPitch - 100.0 * zone.coarseTune - zone.fineTune;
		var playbackRate = 1.0 * Math.pow(2, (100.0 * pitch - baseDetune) / 1200.0);
		var sampleRatio = zone.sampleRate / audioContext.sampleRate;

		var envelope = this.findEnvelope(audioContext, target, when, duration);
		envelope.gain.cancelScheduledValues(audioContext.currentTime);
		envelope.gain.setValueAtTime(this.nearZero, audioContext.currentTime);
		envelope.gain.exponentialRampToValueAtTime(1, when);

		envelope.audioBufferSourceNode = audioContext.createBufferSource();
		var down = this.afterTime;
		if (zone.loopStart > 10 && zone.loopStart < zone.loopEnd) {
			envelope.audioBufferSourceNode.loop = true;
			envelope.audioBufferSourceNode.loopStart = zone.loopStart / zone.sampleRate;
			envelope.audioBufferSourceNode.loopEnd = zone.loopEnd / zone.sampleRate;
		} else {
			envelope.audioBufferSourceNode.loop = false;
			var waveDuration = zone.buffer.duration / playbackRate;
			if (duration > waveDuration - down) {
				if (waveDuration > down * 4) {
					//
				} else {
					down = waveDuration / 4;
				}
				duration = waveDuration - down;
			}
		}
		if ((zone.ahdsr) && (!(continuous))) {
			var decayStart = 0.1;
			var decayVolume = 0.3;
			var releaseStart = 0.5;
			var releaseLength = 5.1;
			envelope.gain.linearRampToValueAtTime(1, when + decayStart);
			envelope.gain.linearRampToValueAtTime(decayVolume, when + releaseStart);
			var endVolume = 0;
			if (duration - releaseStart < releaseLength) {
				endVolume = decayVolume * releaseLength / (duration - releaseStart);
			}
			if (endVolume > this.nearZero) {
				//
			} else {
				endVolume = this.nearZero
			}
			envelope.gain.linearRampToValueAtTime(this.nearZero, when + duration);
		} else {
			envelope.gain.linearRampToValueAtTime(1, when + duration);
		}
		envelope.gain.exponentialRampToValueAtTime(this.nearZero, when + duration + down);

		envelope.audioBufferSourceNode.playbackRate.value = playbackRate;
		if (zone.buffer) {
			envelope.audioBufferSourceNode.buffer = zone.buffer;
		} else {
			console.log('empty buffer ', zone);
		}

		envelope.audioBufferSourceNode.connect(envelope);
		envelope.audioBufferSourceNode.start(when);
		envelope.audioBufferSourceNode.stop(when + duration + down);
		envelope.when = when;
		envelope.duration = duration;
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
			if (e.target == target && audioContext.currentTime > e.when + e.duration + this.afterTime) {
				try{
					e.audioBufferSourceNode.stop(0);
					e.audioBufferSourceNode.disconnect();
					e.audioBufferSourceNode = null;
				}catch(e){
					//audioBufferSourceNode dead already
				}
				envelope = e;
				break;
			}
		}
		if (!(envelope)) {
			envelope = audioContext.createGain();
			envelope.target = target;
			envelope.connect(target);
			var a = this.afterTime;
			var t = this.nearZero;
			envelope.cancel = function () {
				envelope.gain.cancelScheduledValues(audioContext.currentTime);
				var c = envelope.gain.value;
				if (c > t) {
					envelope.gain.setValueAtTime(envelope.gain.value, audioContext.currentTime);
					envelope.gain.exponentialRampToValueAtTime(t, audioContext.currentTime + a);
				}
				envelope.when = audioContext.currentTime + a;
				envelope.duration = 0;
			};
		}
		this.envelopes.push(envelope);
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
