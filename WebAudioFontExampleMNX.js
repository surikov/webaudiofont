console.log('WebAudioFontExampleMNX v0.3', 'https://w3c.github.io/mnx/overview/');
var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContextFunc();
var player = new WebAudioFontPlayer();
var aheadAudioTime = 1;
var nextAudioTime = 0;
var started = false;
var parts = null;
var len = 0;
var currentMeasure = 0;
var measureDuration = 2;
var piano = _tone_Piano_322000003_461_460_45127;
function mnxParse() {
	var mnxTree = new ValueTree('');
	var xml = document.getElementById("mnxText").value;
	mnxTree.fromXMLstring(xml);
	console.log('parsed', mnxTree);
	//console.log('tempo', mnxTree.of('mnx').of('score').of('system').of('measure').of('attributes').of('tempo').of('bpm').value);
	parts = mnxTree.of('mnx').of('score').all('part');
	for (var i = 0; i < parts.length; i++) {
		var n = parts[i].all('measure').length;
		if (n > len) {
			len = n;
		}
	}
}
function mnxPlay() {
	console.log('play');
	mnxParse();
	nextAudioTime = audioContext.currentTime + 0.5;
	currentMeasure = 0;
	started = true;
}
function mnxPause() {
	console.log('pause');
	started = false;
	player.cancelQueue(audioContext);
}
function parseKey(key) {
	var f = key.substring(0, 1);
	if (f.toUpperCase() == 'C') {
		k1 = 0;
	}
	if (f.toUpperCase() == 'D') {
		k1 = 2;
	}
	if (f.toUpperCase() == 'E') {
		k1 = 4;
	}
	if (f.toUpperCase() == 'F') {
		k1 = 5;
	}
	if (f.toUpperCase() == 'G') {
		k1 = 7;
	}
	if (f.toUpperCase() == 'A') {
		k1 = 9;
	}
	if (f.toUpperCase() == 'B') {
		k1 = 11;
	}
	if (f.toUpperCase() == 'H') {
		k1 = 11;
	}
	var k2 = 0;
	var k3 = 0;
	if (key.length > 2) {
		if (key.substring(1, 2) == '#') {
			k2 = 1;
		}
		if (key.substring(1, 2) == 'b') {
			k2 = -1;
		}
		k3 = key.substring(2, 3);
	} else {
		k3 = key.substring(1, 2);
	}
	return k1 + k2 + 12 * k3;
}
function queueNote(eventStart, duration, note) {
	console.log('queueNote', eventStart, duration, note);
	var key = note.of('pitch').value;
	if (key) {
		console.log(eventStart, duration, note);
		var n = parseKey(key);
		player.queueWaveTable(audioContext, audioContext.destination, piano, eventStart, n, duration);
	}
}
function queueEvent(eventStart, duration, event) {
	console.log('queueEvent', eventStart, duration, event);
	var notes = event.all('note');
	for (var i = 0; i < notes.length; i++) {
		queueNote(eventStart, duration, notes[i]);
	}
}
function queueSequence(measureStart, measure) {
	console.log('queueSequence', measureStart, measure);
	var events = measure.all('event');
	var eventStart = 0;
	for (var i = 0; i < events.length; i++) {
		var value = events[i].of('value').numeric(1, 8, 32);
		var duration = measureDuration / value;
		queueEvent(measureStart + eventStart, duration, events[i]);
		eventStart = eventStart + duration;
	}
}
function queueMeasure(measureStart, measure) {
	console.log('queueMeasure', measureStart, measure);
	var sequences = measure.all('sequence');
	for (var i = 0; i < sequences.length; i++) {
		queueSequence(measureStart, sequences[i]);
	}
}
function queueNext() {
	if (started) {
		if (nextAudioTime - aheadAudioTime < audioContext.currentTime) {
			console.log('queueNext', currentMeasure);
			for (var i = 0; i < parts.length; i++) {
				var measure = parts[i].all('measure')[currentMeasure];
				queueMeasure(this.nextAudioTime, measure);
			}
			this.nextAudioTime = this.nextAudioTime + measureDuration;
			currentMeasure++;
			if (currentMeasure >= len) {
				//currentMeasure = 0;
				started = false;
			}
		}
	}
}
setInterval(function () {
	queueNext();
}, 333);
