'use strict'
console.log('WebAudioFont Engine v3.0.02 GPL3');
//docs 
//npm link typescript
//npx typedoc player.ts otypes.ts channel.ts loader.ts reverberator.ts ticker.ts

class WebAudioFontPlayer {
	envelopes: WaveEnvelope[] = [];
	loader = new WebAudioFontLoader(this);
	//onCacheFinish = null;
	//onCacheProgress = null;
	afterTime = 0.05;
	nearZero = 0.000001;
	createChannel(audioContext: AudioContext) {
		return new WebAudioFontChannel(audioContext);
	};
	createReverberator(audioContext: AudioContext) {
		return new WebAudioFontReverberator(audioContext);
	};
	limitVolume(volume: number | undefined): number {
		if (volume) {
			volume = 1.0 * volume;
		} else {
			volume = 0.5;
		}
		return volume;
	};
	queueChord(audioContext: AudioContext, target: AudioNode, preset: WavePreset, when: number, pitches: number[], duration: number, volume?: number, slides?: WaveSlide[][]): WaveEnvelope[] {
		volume = this.limitVolume(volume);
		var envelopes: WaveEnvelope[] = [];
		for (var i = 0; i < pitches.length; i++) {
			var singleSlide: undefined | WaveSlide[] = undefined;
			if (slides) {
				singleSlide = slides[i];
			}
			var envlp: WaveEnvelope | null = this.queueWaveTable(audioContext, target, preset, when, pitches[i], duration, volume - Math.random() * 0.01, singleSlide);
			if (envlp) envelopes.push(envlp);
		}
		return envelopes;
	};
	queueStrumUp(audioContext: AudioContext, target: AudioNode, preset: WavePreset, when: number, pitches: number[], duration: number, volume?: number, slides?: WaveSlide[][]): WaveEnvelope[] {
		pitches.sort(function (a, b) {
			return b - a;
		});
		return this.queueStrum(audioContext, target, preset, when, pitches, duration, volume, slides);
	};
	queueStrumDown(audioContext: AudioContext, target: AudioNode, preset: WavePreset, when: number, pitches: number[], duration: number, volume?: number, slides?: WaveSlide[][]): WaveEnvelope[] {
		pitches.sort(function (a, b) {
			return a - b;
		});
		return this.queueStrum(audioContext, target, preset, when, pitches, duration, volume, slides);
	};
	queueStrum(audioContext: AudioContext, target: AudioNode, preset: WavePreset, when: number, pitches: number[], duration: number, volume?: number, slides?: WaveSlide[][]): WaveEnvelope[] {
		volume = this.limitVolume(volume);
		if (when < audioContext.currentTime) {
			when = audioContext.currentTime;
		}
		var envelopes: WaveEnvelope[] = [];
		for (var i = 0; i < pitches.length; i++) {
			var singleSlide: undefined | WaveSlide[] = undefined;
			if (slides) {
				singleSlide = slides[i];
			}
			var envlp: WaveEnvelope | null = this.queueWaveTable(audioContext, target, preset, when + i * 0.01, pitches[i], duration, volume - Math.random() * 0.01, singleSlide);
			if (envlp) envelopes.push(envlp);
			volume = 0.9 * volume;
		}
		return envelopes;
	};
	queueSnap(audioContext: AudioContext, target: AudioNode, preset: WavePreset, when: number, pitches: number[], duration: number, volume?: number, slides?: WaveSlide[][]): WaveEnvelope[] {
		volume = this.limitVolume(volume);
		volume = 1.5 * (volume || 1.0);
		duration = 0.05;
		return this.queueChord(audioContext, target, preset, when, pitches, duration, volume, slides);
	};
	resumeContext(audioContext: AudioContext) {
		try {
			if (audioContext.state == 'suspended') {
				console.log('audioContext.resume', audioContext);
				audioContext.resume();
			}
		} catch (e) {
			//don't care
		}
	}
	queueWaveTable(audioContext: AudioContext, target: AudioNode, preset: WavePreset, when: number, pitch: number, duration: number, volume?: number, slides?: WaveSlide[]): WaveEnvelope | null {
		this.resumeContext(audioContext);
		volume = this.limitVolume(volume);
		var zone: WaveZone | null = this.findZone(audioContext, preset, pitch);
		if (zone) {
			if (!(zone.buffer)) {
				console.log('empty buffer ', zone);
				return null;
			}
			var baseDetune = zone.originalPitch - 100.0 * zone.coarseTune - zone.fineTune;
			var playbackRate = 1.0 * Math.pow(2, (100.0 * pitch - baseDetune) / 1200.0);
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
			var envelope: WaveEnvelope = this.findEnvelope(audioContext, target);
			this.setupEnvelope(audioContext, envelope, zone, volume, startWhen, waveDuration, duration);
			envelope.audioBufferSourceNode = audioContext.createBufferSource();
			envelope.audioBufferSourceNode.playbackRate.setValueAtTime(playbackRate, 0);
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
				envelope.audioBufferSourceNode.loopStart = zone.loopStart / zone.sampleRate + ((zone.delay) ? zone.delay : 0);
				envelope.audioBufferSourceNode.loopEnd = zone.loopEnd / zone.sampleRate + ((zone.delay) ? zone.delay : 0);
			} else {
				envelope.audioBufferSourceNode.loop = false;
			}
			envelope.audioBufferSourceNode.connect((envelope as any) as GainNode);
			envelope.audioBufferSourceNode.start(startWhen, zone.delay);
			envelope.audioBufferSourceNode.stop(startWhen + waveDuration);
			envelope.when = startWhen;
			envelope.duration = waveDuration;
			envelope.pitch = pitch;
			envelope.preset = preset;
			return envelope;
		} else {
			return null
		}
	};
	noZeroVolume(n: number): number {
		if (n > this.nearZero) {
			return n;
		} else {
			return this.nearZero;
		}
	};
	setupEnvelope(audioContext: AudioContext, envelope: WaveEnvelope, zone: WaveZone, volume: number, when: number, sampleDuration: number, noteDuration: number) {
		((envelope as any) as GainNode).gain.setValueAtTime(this.noZeroVolume(0), audioContext.currentTime);
		var lastTime = 0;
		var lastVolume = 0;
		var duration = noteDuration;
		var zoneahdsr: undefined | boolean | WaveAHDSR[] = zone.ahdsr;
		if (sampleDuration < duration + this.afterTime) {
			duration = sampleDuration - this.afterTime;
		}
		if (zoneahdsr) {
			if (!((zoneahdsr as any).length > 0)) {
				zoneahdsr = [{
					duration: 0,
					volume: 1
				}, {
					duration: 0.5,
					volume: 1
				}, {
					duration: 1.5,
					volume: 0.5
				}, {
					duration: 3,
					volume: 0
				}
				];
			}
		} else {
			zoneahdsr = [{
				duration: 0,
				volume: 1
			}, {
				duration: duration,
				volume: 1
			}
			];
		}
		var ahdsr: WaveAHDSR[] = zoneahdsr as WaveAHDSR[];
		((envelope as any) as GainNode).gain.cancelScheduledValues(when);
		((envelope as any) as GainNode).gain.setValueAtTime(this.noZeroVolume(ahdsr[0].volume * volume), when);
		for (var i = 0; i < ahdsr.length; i++) {
			if (ahdsr[i].duration > 0) {
				if (ahdsr[i].duration + lastTime > duration) {
					var r = 1 - (ahdsr[i].duration + lastTime - duration) / ahdsr[i].duration;
					var n = lastVolume - r * (lastVolume - ahdsr[i].volume);
					((envelope as any) as GainNode).gain.linearRampToValueAtTime(this.noZeroVolume(volume * n), when + duration);
					break;
				}
				lastTime = lastTime + ahdsr[i].duration;
				lastVolume = ahdsr[i].volume;
				((envelope as any) as GainNode).gain.linearRampToValueAtTime(this.noZeroVolume(volume * lastVolume), when + lastTime);
			}
		}
		((envelope as any) as GainNode).gain.linearRampToValueAtTime(this.noZeroVolume(0), when + duration + this.afterTime);
	};
	numValue(aValue: any, defValue: number): number {
		if (typeof aValue === "number") {
			return aValue;
		} else {
			return defValue;
		}
	};
	findEnvelope(audioContext: AudioContext, target: AudioNode): WaveEnvelope {
		var envelope: WaveEnvelope | null = null;
		for (var i = 0; i < this.envelopes.length; i++) {
			var e = this.envelopes[i];
			if (e.target == target && audioContext.currentTime > e.when + e.duration + 0.001) {
				try {
					if (e.audioBufferSourceNode) {
						e.audioBufferSourceNode.disconnect();
						e.audioBufferSourceNode.stop(0);
						e.audioBufferSourceNode = null;
					}
				} catch (x) {
					//audioBufferSourceNode is dead already
				}
				envelope = e;
				break;
			}
		}
		if (!(envelope)) {
			envelope = (audioContext.createGain() as any) as WaveEnvelope;
			envelope.target = target;
			((envelope as any) as GainNode).connect(target);
			envelope.cancel = function () {
				if (envelope && (envelope.when + envelope.duration > audioContext.currentTime)) {
					((envelope as any) as GainNode).gain.cancelScheduledValues(0);
					((envelope as any) as GainNode).gain.setTargetAtTime(0.00001, audioContext.currentTime, 0.1);
					envelope.when = audioContext.currentTime + 0.00001;
					envelope.duration = 0;
				}
			};
			this.envelopes.push(envelope);
		}
		return envelope;
	};
	adjustPreset = function (audioContext: AudioContext, preset: WavePreset) {
		for (var i = 0; i < preset.zones.length; i++) {
			this.adjustZone(audioContext, preset.zones[i]);
		}
	};
	adjustZone = function (audioContext: AudioContext, zone: WaveZone) {
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
	findZone(audioContext: AudioContext, preset: WavePreset, pitch: number): WaveZone | null {
		var zone: WaveZone | null = null;
		for (var i = preset.zones.length - 1; i >= 0; i--) {
			zone = preset.zones[i];
			if (zone.keyRangeLow <= pitch && zone.keyRangeHigh + 1 >= pitch) {
				break;
			}
		}
		try {
			if (zone) this.adjustZone(audioContext, zone);
		} catch (ex) {
			console.log('adjustZone', ex);
		}
		return zone;
	};
	cancelQueue(audioContext: AudioContext) {
		for (var i = 0; i < this.envelopes.length; i++) {
			var e = this.envelopes[i];
			((e as any) as GainNode).gain.cancelScheduledValues(0);
			((e as any) as GainNode).gain.setValueAtTime(this.nearZero, audioContext.currentTime);
			e.when = -1;
			try {
				if (e.audioBufferSourceNode) e.audioBufferSourceNode.disconnect();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
}
