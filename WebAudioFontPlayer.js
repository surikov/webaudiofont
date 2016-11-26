console.log('WebAudioFont Player v1.43');
function WebAudioFontPlayer() {
	this.envelopes = [];
	this.afterTime = 0.1;
	this.nearZero = 0.000001;
	this.queueWaveTable = function (audioContext, target, preset, when, pitch, duration,volume,slides) {
		if(volume){
			volume=1.0*volume;
		}else{
			volume=1.0;
		}
		var zone = this.findZone(audioContext, preset, pitch);
		if (!(zone.buffer)) {
			console.log('empty buffer ', zone);
			return;
		}
		var continuous=true;
		if(zone.ahdsr){
			continuous=false;
		}
		var baseDetune = zone.originalPitch - 100.0 * zone.coarseTune - zone.fineTune;
		var playbackRate = 1.0 * Math.pow(2, (100.0 * pitch - baseDetune) / 1200.0);
		var sampleRatio = zone.sampleRate / audioContext.sampleRate;
		var startWhen = when;
		if (when < audioContext.currentTime) {
			startWhen = audioContext.currentTime;
		}
		var waveDuration = duration + this.afterTime;
		if (zone.loopStart < 1 || zone.loopStart >= zone.loopEnd) {
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
		envelope.gain.exponentialRampToValueAtTime(volume, startWhen + a);
		if (waveDuration < h) {
			envelope.gain.linearRampToValueAtTime(volume, startWhen + 7 * waveDuration / 8 - a);
		} else {
			if (continuous) {
				envelope.gain.linearRampToValueAtTime(volume, startWhen + waveDuration - this.afterTime);
			} else {
				if (waveDuration + this.afterTime < d) {
					envelope.gain.linearRampToValueAtTime(volume*0.3, startWhen + waveDuration - this.afterTime);
				} else {
					envelope.gain.linearRampToValueAtTime(volume*0.3, startWhen + d - this.afterTime);
					if (waveDuration < s) {
						envelope.gain.linearRampToValueAtTime(volume*0.1, startWhen + waveDuration - this.afterTime);
					} else {
						envelope.gain.linearRampToValueAtTime(this.nearZero, startWhen + waveDuration - this.afterTime);
					}
				}
			}
		}
		envelope.gain.exponentialRampToValueAtTime(this.nearZero, startWhen + waveDuration);
		envelope.audioBufferSourceNode = audioContext.createBufferSource();
		envelope.audioBufferSourceNode.playbackRate.value = playbackRate;
		if(slides){
			if(slides.length>0){
				envelope.audioBufferSourceNode.playbackRate.setValueAtTime(playbackRate, when);
				for(var i=0;i<slides.length;i++){
					var newPlaybackRate = 1.0 * Math.pow(2, (100.0 * slides[i].pitch - baseDetune) / 1200.0);
					var newWhen=when + slides[i].when;
					envelope.audioBufferSourceNode.playbackRate.linearRampToValueAtTime(newPlaybackRate, newWhen);
				}
			}
		}
		envelope.audioBufferSourceNode.buffer = zone.buffer;
		if (zone.loopStart > 1 && zone.loopStart < zone.loopEnd) {
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
		envelope.duration = waveDuration + 0.1;
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
	this.adjustPreset = function (audioContext, preset) {
		for (var i = 0; i < preset.zones.length; i++) {
			this.adjustZone(audioContext, preset.zones[i]);
		}
	};
	this.adjustZone = function (audioContext, zone) {
		if (zone.buffer) {
			//
		} else {
			if (zone.sample) {
				zone.buffer = audioContext.createBuffer(1, zone.sample.length, zone.sampleRate);
				var float32Array = zone.buffer.getChannelData(0);
				for (var i = 0; i < zone.sample.length; i++) {
					float32Array[i] = zone.sample[i] / 65536.0;
				}
			} else {
				if (zone.file) {
					var datalen = zone.file.length / 2;
					var arraybuffer = new ArrayBuffer(datalen);
					var view = new Uint8Array(arraybuffer);
					var s = zone.file.substr(0, 2);
					var n = parseInt(s, 16);
					view[0] = n;
					for (var i = 1; i < datalen; i++) {
						s = zone.file.substr(i * 2, 2);
						n = parseInt(s, 16);
						view[i] = n;
					}
					audioContext.decodeAudioData(arraybuffer, function (audioBuffer) {
						zone.buffer=audioBuffer;
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
			if (zone.keyRangeLow <= pitch && zone.keyRangeHigh >= pitch) {
				break;
			}
		}
		this.adjustZone(audioContext, zone);
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