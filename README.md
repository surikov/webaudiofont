# WebAudioFont

WebAudioFont is a set of resources and associated technology that uses sample-based synthesis to play musical instruments in browser.

![Screenshot](https://surikov.github.io/riffshare/img/sp320opt.gif)

## Code examples

- [simple example](http://jsbin.com/lamidog/1/edit?html,output)
- [virtual drums](http://jsbin.com/wajopuy/1/edit?html,output)
- [virtual piano](http://jsbin.com/binelu/1/edit?html,output)

### Parts of WebAudioFont

- Library of sounds
- Metadata that describe how to play sounds
- WebAudioFontPlayer.js that uses metadata and sounds for playing instruments
- [Catalog of available sounds](https://surikov.github.io/webaudiofontdata/)

### Underlaying technology

WebAudioFont uses [Web Audio API](https://www.google.ru/search?q=web+audio+api) to play instruments.

Synthesizer uses [wavetables](https://www.google.ru/search?q=wavetable+synthesis) to play sound.

## Use cases

- Virtual instruments
- Interactive music generated on the fly
- Sound effects for non-music applications

## How to use

### Minimal HTML page

```
<html>
	<head>
		<script src='https://surikov.github.io/webaudiofont/npm/dist/WebAudioFontPlayer.js'></script>
		<script src='https://surikov.github.io/webaudiofontdata/sound/0250_SoundBlasterOld_sf2.js'></script>
		<script>
			var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
			var audioContext = new AudioContextFunc();
			var player=new WebAudioFontPlayer();
			player.loader.decodeAfterLoading(audioContext, '_tone_0250_SoundBlasterOld_sf2');
			function play(){
				player.queueWaveTable(audioContext, audioContext.destination
					, _tone_0250_SoundBlasterOld_sf2, 0, 12*4+7, 2);
				return false;
			}
		</script>
	</head>
	<body>
		<p><a href='javascript:play();'>Play!</a></p>
	</body>
</html>
```
		
This code plays instrument [_tone_0250_SoundBlasterOld_sf2](https://surikov.github.io/webaudiofontdata/sound/0250_SoundBlasterOld_sf2.html) with pitch 55.

[open in JSBin](http://jsbin.com/hopuhor/1/edit?html,output)


### How to use catalog of sounds:

- open [index page](https://surikov.github.io/webaudiofontdata/sound/)
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
			,sample:'...
		}
		,{
			midi:46
			,originalPitch:7001
			,keyRangeLow:63
			,keyRangeHigh:76
			,file:'...
```

It creates object and assigns it to a global variable.

Each instrument consists of one or more zones, each zone has own properties for wavetable. Files contains of array with audio data. You can use instruments locally without [CORS problem](https://www.google.ru/search?q=cors+problem).

- 'sample' is raw PCM data
- 'file' is content of audio file

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



- [WebAudioFontExampleAll.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleAll.html) - links to examples.
- [WebAudioFontExampleSimple.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleSimple.html) - simple example.
-  - virtual drums. This example shows using of drum instruments.
- [WebAudioFontExamplePiano.html](https://surikov.github.io/webaudiofont/WebAudioFontExamplePiano.html) - virtual piano. This example shows using of tone instrument.
- [WebAudioFontExampleFlute.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleFlute.html) - virtual Pan flute. This example shows using of Envelope objects to start and stop a note playing.
- [WebAudioFontExampleVoice.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleVoice.html) - two voice connected to different AudioNodes. This example shows how to create chain of AudioNodes and handle each instrument individually.
- [WebAudioFontExampleFx.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleFx.html) - sound slides from one pitch to another one. This example shows how to access AudioBufferSourceNode of played note.
- [WebAudioFontExampleTune.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleTune.html) - music loop. This example shows how to create and modify music in realtime.
- [WebAudioFontExampleTune2.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleTune2.html) - music loop. This example shows how to code music.
- [WebAudioFontExampleTune3.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleTune3.html) - music loop. This example shows how to code music.
- [WebAudioFontExampleTune4.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleTune4.html) - music loop. This example shows how to code music with compressed samples and focusless timeout.
- [WebAudioFontExampleTouch.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleTouch.html) - multitouch beatpad. This example shows how to optimize application for mobile devices.
- [WebAudioFontExampleSelector.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleSelector.html) - preset selector. This example shows how to load JS presets dynamically.
- [WebAudioFontExampleBend.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleBend.html) - music loop. This example shows how to use pitch bend.
- [WebAudioFontExampleMIDI.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleMIDI.html) - keyboard listener. This example shows how to catch MIDI events.
- [WebAudioFontExampleFilter.html](https://surikov.github.io/webaudiofont/WebAudioFontExampleFilter.html) - sampled overdrive vs WaveShaper. This example shows how to use filters.
- [https://jsbin.com/zabike/edit?html,output](https://jsbin.com/zabike/edit?html,output) - music loop. This example shows how to exchange code.

## Using

[RiffShare](https://surikov.github.io/riffshare/tools.html) - create and exchange tunes in 3D environment.




