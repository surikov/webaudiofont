'use strict'
console.log('WebAudioFont Ticker v1.01 GPL3');
function WebAudioFontTicker() {
	this.startLoop = function (when, loopStart, lopPosition, loopEnd, action) {

	};
	this.tick = function (when, start, duration) {

	}
	this.cancel = function () {

	};
	return this;
}
if (typeof module === 'object' && module.exports) {
	module.exports = WebAudioFontTicker;
}
if (typeof window !== 'undefined') {
	window.WebAudioFontTicker = WebAudioFontTicker;
}
