'use strict'
console.log('WebAudioFont Loader v1.05');
function WebAudioFontLoader(player) {
	this.player = player;
	this.cached = [];
	this.startLoad = function (audioContext, filePath, variableName) {
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
