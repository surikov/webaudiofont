'use strict'
console.log('WebAudioFont Ticker v1.04 GPL3');

function WebAudioFontTicker() {
	var me = this;
	me.stateStop = 1;
	me.statePlay = 2;
	me.stateEnd = 3;
	me.state = me.stateStop;
	me.stepDuration = 0.1;
	me.lastPosition = 0;
	me.playLoop = function (player, audioContext, loopStart, loopPosition, loopEnd, queue) {
		me.startTicks(audioContext, function (when, from, to) {
			for (var i = 0; i < queue.length; i++) {
				var note = queue[i];
				if (note.when >= from && note.when < to) {
					var start = when + note.when - from;
					player.queueWaveTable(audioContext, note.destination, note.preset, start, note.pitch, note.duration, note.volume, note.slides);
				}
			}
		}, loopStart, loopPosition, loopEnd, function (at) {
			player.cancelQueue(audioContext);
		});
	};
	me.startTicks = function (audioContext, onTick, loopStart, loopPosition, loopEnd, onEnd) {
		if (me.state == me.stateStop) {
			me.state = me.statePlay;
			me.tick(audioContext, audioContext.currentTime, onTick, loopStart, loopPosition, loopEnd, onEnd);
		}
	};
	me.tick = function (audioContext, nextAudioTime, onTick, loopStart, loopPosition, loopEnd, onEnd) {
		me.lastPosition = loopPosition;
		if (me.state == me.stateEnd) {
			me.state = me.stateStop;
			onEnd(loopPosition);
		} else {
			if (me.state == me.statePlay) {
				if (nextAudioTime - me.stepDuration < audioContext.currentTime) {
					if (loopPosition + me.stepDuration < loopEnd) {
						var from = loopPosition;
						var to = loopPosition + me.stepDuration;
						onTick(nextAudioTime, from, to);
						loopPosition = to;
					} else {
						var from = loopPosition;
						var to = loopEnd;
						onTick(nextAudioTime, from, to);
						from = loopStart;
						to = loopStart + me.stepDuration - (loopEnd - loopPosition);
						if (to < loopEnd) {
							onTick(nextAudioTime + (loopEnd - loopPosition), from, to);
							loopPosition = to;
						} else {
							loopPosition = loopEnd;
						}
					}
					nextAudioTime = nextAudioTime + me.stepDuration;
					if (nextAudioTime < audioContext.currentTime) {
						nextAudioTime = audioContext.currentTime
					}
				}
				window.requestAnimationFrame(function (time) {
					me.tick(audioContext, nextAudioTime, onTick, loopStart, loopPosition, loopEnd, onEnd);
				});
			}
		}
	}
	me.cancel = function () {
		if (me.state == me.statePlay) {
			me.state = me.stateEnd;
		}
	};
	return me;
}
if (typeof module === 'object' && module.exports) {
	module.exports = WebAudioFontTicker;
}
if (typeof window !== 'undefined') {
	window.WebAudioFontTicker = WebAudioFontTicker;
}