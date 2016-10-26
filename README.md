# WebAudioFont

WebAudioFont is a set of resources and associated technology that uses sample-based synthesis to play musical instruments in browser.

### Parts of WebAudioFont

- Library of sounds
- Metadata that describe how to play sounds
- WebAudioFontPlayer.js that uses metadata and sounds for playing instruments
- Catalog of available sounds

### Underlaying technology

WebAudioFont uses Web Audio API to play instruments.

Synthesizer uses wavetables to play sound.

## Use cases

- Virtual instruments: Drums, Piano, Pan Flute
- Interactive music created on the fly: Melody loop
- Sound effects for non-music applications: Car sound

## How to use

### Minimal HTML page

```
<html>
	<head>
		<script src='WebAudioFontPlayer.js'></script>
		<script src='webaudiofont/32.0.Accoustic_32Bsaccousticbs_461_460_45127.js'></script>
		<script>
			var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
			var audioContext = new AudioContextFunc();
			var player=new WebAudioFontPlayer();
		</script>
	</head>
	<body>
		<p><a href='javascript:player.queueWaveTable(audioContext, audioContext.destination, _tone_Accoustic_32Bsaccousticbs_461_460_45127, 0, 12*4+7, 2);'>click!</a></p>
	</body>
</html>
```
		
This code plays instrument _tone_Accoustic_32Bsaccousticbs_461_460_45127 from 32.0.Accoustic_32Bsaccousticbs_461_460_45127.js with pitch 55. See simple example.

### How to use catalog of sounds:

- open index page
- find instrument
- copy name of file to include instrument data
- copy name of variable to refer to instrument
- add this info to a page

## Sound file format

Each file looks like this:

```
console.log('load _tone_Harp000087_461_460_45127');
var _tone_Harp000087_461_460_45127={
	zones:[
		{
			midi:46
			,originalPitch:5700
			,keyRangeLow:0
			,keyRangeHigh:62
			,loopStart:3340
			,loopEnd:3841
			,coarseTune:0
			,fineTune:0
			,sampleRate:22050
			,ahdsr:true
			,sample:[0,-16,-17,97,124,-9, ...
		}
		,{
			midi:46
			,originalPitch:7001
			,keyRangeLow:63
			,keyRangeHigh:76
			,...
```

It creates object and assigns it to a global variable.

Each instrument consists of one or more zones, each zone has own properties for wavetable. Files contains of array with audio data. You can use instruments locally without CORS problem.

Some wavetables uses loops and AHDSR volume.

## Player

WebAudioFontPlayer has function queueWaveTable (audioContext, target, preset, when, pitch, duration, continuous)

Parameters:

- audioContext - AudioContext
- target - a node to connect, for example audioContext.destination
- preset - variable with instrument preset
- when - when to play, audioContext.currentTime or 0 to play now, audioContext.currentTime + 3 to play after 3 seconds
- pitch - note pitch from 0 to 127, for example 2+12*4 to play D of fourth octave
- duration - note duration in seconds, for example 4 to play 4 seconds
- continuous - true to ignore AHDSR
- queueWaveTable returns envelope object. You can use this object to cancel sound or access to AudioBufferSourceNode.

## All examples

- [WebAudioFontExampleAll.html](http://molgav.nn.ru/WebAudioFontExampleAll.html) - links to examples.
- WebAudioFontExampleSimple.html - simple example.
- WebAudioFontExampleDrums.html - virtual drums. This example shows using of drum instruments.
- WebAudioFontExamplePiano.html - virtual piano. This example shows using of tone instrument.
- WebAudioFontExampleFlute.html - virtual Pan flute. This example shows using of Envelope objects to start and stop a note playing.
- WebAudioFontExampleVoice.html - two voice connected to different AudioNodes. This example shows how to create chain of AudioNodes and handle each instrument individually.
- WebAudioFontExampleFx.html - sound slides from one pitch to another one. This example shows how to access AudioBufferSourceNode of played note.
- WebAudioFontExampleTune.html - music loop. This example shows how to create and modify music in realtime.
- WebAudioFontExampleTouch.html - multitouch beatpad. This example shows how to optimize application for mobile devices.



