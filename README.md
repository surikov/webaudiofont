# WebAudioFont v1.43

WebAudioFont is a set of resources and associated technology that uses sample-based synthesis to play musical instruments in browser.

### Parts of WebAudioFont

- Library of sounds
- Metadata that describe how to play sounds
- WebAudioFontPlayer.js that uses metadata and sounds for playing instruments
- [Catalog of available sounds](http://molgav.nn.ru/webaudiofont/index.html)
- [Catalog of compressed sounds](http://molgav.nn.ru/compress/index.html)

### Underlaying technology

WebAudioFont uses [Web Audio API](https://www.google.ru/search?q=web+audio+api) to play instruments.

Synthesizer uses [wavetables](https://www.google.ru/search?q=wavetable+synthesis) to play sound.

## Use cases

- Virtual instruments: [Drums](http://molgav.nn.ru/WebAudioFontExampleDrums.html), [Piano](http://molgav.nn.ru/WebAudioFontExamplePiano.html), [Pan Flute](http://molgav.nn.ru/WebAudioFontExampleFlute.html)
- Interactive music generated on the fly: [Melody loop](http://molgav.nn.ru/WebAudioFontExampleTune.html)
- Sound effects for non-music applications: [Car sound](http://molgav.nn.ru/WebAudioFontExampleFx.html)

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
		
This code plays instrument [_tone_Accoustic_32Bsaccousticbs_461_460_45127](http://molgav.nn.ru/webaudiofont/32.0.Accoustic_32Bsaccousticbs_461_460_45127.html) from [32.0.Accoustic_32Bsaccousticbs_461_460_45127.js](http://molgav.nn.ru/webaudiofont/32.0.Accoustic_32Bsaccousticbs_461_460_45127.js) with pitch 55. See [simple example](http://molgav.nn.ru/WebAudioFontExampleSimple.html).

### How to use catalog of sounds:

- open [index page](http://molgav.nn.ru/webaudiofont/index.html)
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
			,file:'4f67675300020
```

It creates object and assigns it to a global variable.

Each instrument consists of one or more zones, each zone has own properties for wavetable. Files contains of array with audio data. You can use instruments locally without [CORS problem](https://www.google.ru/search?q=cors+problem).

- 'sample' is an array of 16bit values with PCM data
- 'file' is a string with HEX numbers of any supported audio file

You need to add *<body onload='player.adjustPreset(audioContext,selectedPreset);'>* for compressed sounds to avoid delay of sample data parsing.

Some wavetables uses loops and [AHDSR volume](https://www.google.ru/search?q=ahdsr).

## Player

WebAudioFontPlayer has function queueWaveTable (audioContext, target, preset, when, pitch, duration, volume, slides)

Parameters:

- audioContext - AudioContext
- target - a node to connect, for example audioContext.destination
- preset - variable with instrument preset
- when - when to play, audioContext.currentTime or 0 to play now, audioContext.currentTime + 3 to play after 3 seconds
- pitch - note pitch from 0 to 127, for example 2+12*4 to play D of fourth octave (use MIDI key for drums)
- duration - note duration in seconds, for example 4 to play 4 seconds
- volume - 0.0-1.0 volume
- slides - array of pitch bends

Function queueWaveTable returns envelope object. You can use this object to cancel sound or access to AudioBufferSourceNode.

## All examples

- [WebAudioFontExampleAll.html](http://molgav.nn.ru/WebAudioFontExampleAll.html) - links to examples.
- [WebAudioFontExampleSimple.html](http://molgav.nn.ru/WebAudioFontExampleSimple.html) - simple example.
- [WebAudioFontExampleDrums.html](http://molgav.nn.ru/WebAudioFontExampleDrums.html) - virtual drums. This example shows using of drum instruments.
- [WebAudioFontExamplePiano.html](http://molgav.nn.ru/WebAudioFontExamplePiano.html) - virtual piano. This example shows using of tone instrument.
- [WebAudioFontExampleFlute.html](http://molgav.nn.ru/WebAudioFontExampleFlute.html) - virtual Pan flute. This example shows using of Envelope objects to start and stop a note playing.
- [WebAudioFontExampleVoice.html](http://molgav.nn.ru/WebAudioFontExampleVoice.html) - two voice connected to different AudioNodes. This example shows how to create chain of AudioNodes and handle each instrument individually.
- [WebAudioFontExampleFx.html](http://molgav.nn.ru/WebAudioFontExampleFx.html) - sound slides from one pitch to another one. This example shows how to access AudioBufferSourceNode of played note.
- [WebAudioFontExampleTune.html](http://molgav.nn.ru/WebAudioFontExampleTune.html) - music loop. This example shows how to create and modify music in realtime.
- [WebAudioFontExampleTune2.html](http://molgav.nn.ru/WebAudioFontExampleTune2.html) - music loop. This example shows how to code music.
- [WebAudioFontExampleTune3.html](http://molgav.nn.ru/WebAudioFontExampleTune3.html) - music loop. This example shows how to code music.
- [WebAudioFontExampleTune4.html](http://molgav.nn.ru/WebAudioFontExampleTune4.html) - music loop. This example shows how to code music with compressed samples.
- [WebAudioFontExampleTouch.html](http://molgav.nn.ru/WebAudioFontExampleTouc5.html) - multitouch beatpad. This example shows how to optimize application for mobile devices.
- [WebAudioFontExampleSelector.html](http://molgav.nn.ru/WebAudioFontExampleSelector.html) - preset selector. This example shows how to load JS presets dynamically.
- [WebAudioFontExampleBend.html](http://molgav.nn.ru/WebAudioFontExampleBend.html) - music loop. This example shows how to use pitch bend.
- [WebAudioFontExampleMIDI.html](http://molgav.nn.ru/WebAudioFontExampleMIDI.html) - music loop. This example shows how to catch MIDI events.
- [https://jsbin.com/zabike/edit?html,output](https://jsbin.com/zabike/edit?html,output) - music loop. This example shows how to exchange code.


