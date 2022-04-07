"use strict";
var ZvoogParameterEmpty = /** @class */ (function () {
    function ZvoogParameterEmpty() {
    }
    ZvoogParameterEmpty.prototype.label = function () {
        return 'Empty parameter';
    };
    ZvoogParameterEmpty.prototype.cancelScheduledValues = function (cancelTime) {
        //
    };
    ZvoogParameterEmpty.prototype.linearRampToValueAtTime = function (value, endTime) {
        //
    };
    ZvoogParameterEmpty.prototype.setValueAtTime = function (value, startTime) {
        //
    };
    return ZvoogParameterEmpty;
}());
var ZvoogFilterSourceEmpty = /** @class */ (function () {
    function ZvoogFilterSourceEmpty() {
        this.vals = [];
        //
    }
    ZvoogFilterSourceEmpty.prototype.prepare = function (audioContext) {
        this.base = audioContext.createGain();
        this.params = [new ZvoogParameterEmpty(), new ZvoogParameterEmpty()];
    };
    ZvoogFilterSourceEmpty.prototype.getInput = function () {
        return this.base;
    };
    ZvoogFilterSourceEmpty.prototype.getOutput = function () {
        return this.base;
    };
    ZvoogFilterSourceEmpty.prototype.getParams = function () {
        return this.params;
    };
    ZvoogFilterSourceEmpty.prototype.getValues = function () {
        return this.vals;
    };
    ZvoogFilterSourceEmpty.prototype.cancelSchedule = function () {
        //
    };
    ZvoogFilterSourceEmpty.prototype.schedule = function (when, tempo, chord) {
        //
    };
    ZvoogFilterSourceEmpty.prototype.busy = function () {
        return 0;
    };
    ZvoogFilterSourceEmpty.prototype.label = function () {
        return 'Empty filter or source';
    };
    return ZvoogFilterSourceEmpty;
}());
var TestSong = /** @class */ (function () {
    function TestSong() {
    }
    /*createRandomCurve(duration: number): ZvoogCurve {
        //console.log('createRandomCurve',duration);
        let cu: ZvoogCurve = {
            duration: duration
            , points: []
        };
        var curPoint: number = 0;
        while (curPoint < duration) {
            //var delta = Math.round(Math.random() * 5000 + 5000);
            var delta: number = 384 * (Math.random() > 0.5 ? 1 / 4 : 2);//{ count: Math.random() > 0.5 ? 0.25 : 0.5, division: duration.division };
            var po: ZvoogPoint = { duration: delta, velocity: Math.floor(Math.random() * 127) };
            cu.points.push(po);
            curPoint = curPoint + delta;
        }
        return cu;
    }
    createRandomPoint(duration: number):ZvoogPoint{

    }*/
    //createRandomLine(songlenseconds: number): ZvoogParameterLine {
    TestSong.prototype.createRandomLine = function (measures) {
        var lin = {
            points: []
        };
        var m = 0;
        lin.points.push({ skipMeasures: 0, skip384: 0, velocity: Math.floor(Math.random() * 127) });
        for (var i = 0; i < measures.length; i++) {
            m = m + 1;
            if (Math.random() > 0.8) {
                lin.points.push({ skipMeasures: m, skip384: 0, velocity: Math.floor(Math.random() * 127) });
                m = 0;
            }
        }
        /*
                var curPoint: number = 0;
                var songlenseconds = durations2time(measures);
                while (curPoint < songlenseconds) {
                    //var delta = Math.round(Math.random() * 24000 + 3000);
                    var delta: number = 1 + Math.round(Math.random() * songlenseconds);
                    var po: ZvoogPoint = { duration: delta, velocity: Math.floor(Math.random() * 127) };
                    lin.points.push(po);
                    curPoint = curPoint + delta;
                }*/
        return lin;
    };
    //createRandomEffect(songlenseconds: number): ZvoogTrackEffect {
    TestSong.prototype.createRandomEffect = function (measures) {
        var plugin = new ZvoogFilterSourceEmpty();
        var parameters = [];
        var parCount = 1 + Math.round(Math.random() * 5);
        for (var i = 0; i < parCount; i++) {
            parameters.push(this.createRandomLine(measures));
        }
        var fx = { plugin: plugin, disabled: false, parameters: parameters };
        return fx;
    };
    TestSong.prototype.createRandomPitch = function (pre) {
        var d = 384 / 8;
        if (Math.random() > 0.5) {
            d = 384 / 4;
        }
        if (Math.random() > 0.5) {
            d = 384 / 2;
        }
        var pi = {
            duration: d,
            pitch: (pre > 0) ? pre + Math.floor(Math.random() * 21 - 10) : Math.floor(Math.random() * 120)
            //,pitch: (pre > 0) ?pre+ 0 : Math.floor(Math.random() * 120)
        };
        //console.log(pre,pi.pitch);
        return pi;
    };
    TestSong.prototype.createRandomName = function () {
        var colors = ['Red', 'Green', 'Magenta', 'White', 'Yellow', 'Black', 'Pink', 'Blue', 'Cyan', 'Silver'];
        var cnt = 1 + Math.ceil(Math.random() * 3);
        var t = '';
        for (var i = 0; i < cnt; i++) {
            var n = Math.floor(Math.random() * colors.length);
            t = t + colors[n] + ' ';
        }
        return t;
    };
    TestSong.prototype.createRandomChord = function (count, division) {
        var ch = {
            //when: Math.round(Math.random() * duration.count ) 
            when: Math.floor((384 * Math.random() * count / division) / 24) * 24,
            values: [],
            title: '',
            fretHint: [],
            text: ''
        };
        if (Math.random() > 0.95) {
            ch.title = 'G' + Math.round(Math.random() * 10);
        }
        if (Math.random() > 0.95) {
            ch.title = 'Em' + Math.round(Math.random() * 10);
        }
        if (Math.random() > 0.95) {
            ch.title = 'A7' + Math.round(Math.random() * 10);
        }
        if (Math.random() > 0.95) {
            ch.text = 'Bla-bla-bla';
        }
        var valCount = Math.round(Math.random() * 2) + 1;
        /*var k: ZvoogKey = { envelope: [this.createRandomPitch()] };
        if (Math.random() > 0.9) {
            k.envelope.push(this.createRandomPitch());
        }*/
        for (var i = 0; i < valCount; i++) {
            //var pitch:ZvoogPitch=this.createRandomPitch();
            var k = {
                envelope: [this.createRandomPitch(0)],
                stepHint: 0,
                shiftHint: 0,
                octaveHint: 0
            };
            if (Math.random() > 0.9) {
                k.envelope.push(this.createRandomPitch(k.envelope[0].pitch));
            }
            //k.envelope.push(this.createRandomPitch(k.envelope[0].pitch));
            //k.envelope.push(this.createRandomPitch(k.envelope[0].pitch));
            ch.values.push(k);
        }
        return ch;
    };
    //createRandomChunk(count: number, division: number): ZvoogPattern {
    TestSong.prototype.createRandomChunk = function (meausere) {
        var p = {
            //meter: duration
            /*meter: {
                count: count
                , division: division
            }
            , tempo: Math.random() > 0.8 ? 120 : 100
            ,*/ chords: [],
            title: '/' + Math.round(Math.random() * 1000),
            clefHint: Math.round(Math.random() * 3),
            keyHint: Math.round(Math.random() * 22 - 11)
        };
        var chCount = 1 + Math.round(Math.random() * 2);
        for (var i = 0; i < chCount; i++) {
            p.chords.push(this.createRandomChord(meausere.meter.count, meausere.meter.division));
        }
        return p;
    };
    TestSong.prototype.createRandomMeasure = function (count, division) {
        var p = {
            meter: {
                count: count,
                division: division
            },
            tempo: Math.random() > 0.8 ? 120 : 100
        };
        return p;
    };
    TestSong.prototype.createRandomVoice = function (measures, voiceOrder) {
        var v = {
            chunks: [],
            disabled: false,
            source: {
                plugin: new ZvoogFilterSourceEmpty(),
                parameters: []
            },
            effects: [],
            title: this.createRandomName() + 'voice '
        };
        var parCount = 1 + Math.round(Math.random() * 5);
        for (var i = 0; i < parCount; i++) {
            v.source.parameters.push(this.createRandomLine(measures));
        }
        var mainFxCount = 1 + Math.round(Math.random() * 3);
        for (var i = 0; i < mainFxCount; i++) {
            v.effects.push(this.createRandomEffect(measures));
        }
        /*var curPoint: number = 0;
        while (curPoint < songlenseconds) {
            //var delta = Math.round(Math.random() * 5000 + 3000);
            //var delta: number = Math.random() > 0.9 ? 3 * 384 / 4 : 4 * 384 / 4;
            var cnt = Math.random() > 0.9 ? 3 : 4;
            v.chunks.push(this.createRandomChunk(cnt, 4));
            curPoint = curPoint + cnt * 384 / 4;
        }*/
        for (var i = 0; i < measures.length; i++) {
            v.chunks.push(this.createRandomChunk(measures[i]));
        }
        return v;
    };
    //createRandomTrack(songlenseconds: number, trackOrder: number): ZvoogTrack {
    TestSong.prototype.createRandomTrack = function (measures, trackOrder) {
        var t = {
            voices: [],
            disabled: false,
            effects: [],
            title: this.createRandomName() + 'track ',
            strings: []
        };
        var mainFxCount = 1 + Math.round(Math.random() * 3);
        for (var i = 0; i < mainFxCount; i++) {
            t.effects.push(this.createRandomEffect(measures));
        }
        var mainVoxCount = 1 + Math.round(Math.random() * 3 + 1);
        for (var i = 0; i < mainVoxCount; i++) {
            t.voices.push(this.createRandomVoice(measures, i));
        }
        return t;
    };
    TestSong.prototype.createKeyPattern = function () {
        var keyPattern = [];
        for (var o = 0; o < 10; o++) {
            keyPattern.push(3);
            keyPattern.push(2);
            keyPattern.push(1);
            keyPattern.push(2);
            keyPattern.push(1);
            keyPattern.push(1);
            keyPattern.push(2);
            keyPattern.push(1);
            keyPattern.push(2);
            keyPattern.push(1);
            keyPattern.push(2);
            keyPattern.push(1);
        }
        return keyPattern;
    };
    TestSong.prototype.createRandomSchedule = function () {
        //var duration: ZvoogMeter = { count: Math.round(Math.random() * 100 + 50) * 4, division: 4 };//Math.round(Math.random() * 2 + 1) * 60000;
        var songdurationseconds = Math.round(Math.random() * 200 + 150) * 50; //Math.round(Math.random() * 2 + 1) * 60000;
        var t = this.createRandomName() + 'project';
        var s = {
            title: t,
            description: this.createRandomName() + 'description'
            //, duration: duration
            ,
            timeline: [],
            tracks: [],
            effects: [],
            macros: [
            /*
                            {
                                key: undoRedoBunch, point: { x: 0, y: 0, z: 100 }, properties: {
                                    commands: [
                                        { key: undoRedoChangeProjectTitle, properties: { oldTitle: 'old project title', newTitle: 'Next title' }, point: { x: 0, y: 0, z: 100 } }
                                        , { key: undoRedoChangeProjectTitle, properties: { oldTitle: 'Next title', newTitle: 'Another title' }, point: { x: 0, y: 0, z: 100 } }
                                        , { key: undoRedoChangeProjectTitle, properties: { oldTitle: 'Another title', newTitle: t }, point: { x: 0, y: 0, z: 100 } }
                                    ]
                                }
                            }*/
            ],
            macroPosition: 2,
            masterPosition: 1,
            gridPattern: [
                { duration: 384 / 16, power: 3 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 1 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 2 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 1 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 0 },
                { duration: 384 / 16, power: 0 }
            ],
            keyPattern: this.createKeyPattern(),
            horizontal: true,
            locked: false,
            selectedLayer: { track_songFx: 0, voice_trackFx_songFxParam: 0, source_voiceFx_trackParam: 0, sourceParam_voiceFxParam: 0 },
            selectedMeasures: { from: 0, duration: 0 }
        };
        var curPoint = 0;
        while (curPoint < songdurationseconds) {
            var cnt = Math.random() > 0.9 ? 3 : 4;
            var measure = this.createRandomMeasure(cnt, 4);
            s.timeline.push(measure);
            curPoint = curPoint + cnt * 384 / 4;
        }
        var mainFxCount = 1 + Math.round(Math.random() * 3);
        //console.log('mainFxCount',mainFxCount);
        for (var i = 0; i < mainFxCount; i++) {
            s.effects.push(this.createRandomEffect(s.timeline));
        }
        var trkCount = Math.round(Math.random() * 5) + 1;
        for (var i = 0; i < trkCount; i++) {
            s.tracks.push(this.createRandomTrack(s.timeline, i));
        }
        var tc = 0;
        var vc = 0;
        if (s.tracks.length > 1)
            tc = 1;
        if (s.tracks[tc].voices.length > 1)
            vc = 1;
        s.selectedLayer.track_songFx = tc;
        s.selectedLayer.voice_trackFx_songFxParam = vc;
        return s;
    };
    return TestSong;
}());
console.log('ZvoogEngine v1.52');
//function duration2time(bpm: number, duration: ZvoogMeter): number {
function duration2time(bpm, duration384) {
    var n4 = 60 / bpm;
    //var part = duration.division / (4 * duration.count);
    var part = 384 / (4 * duration384);
    return n4 / part;
}
function durations2time(measures) {
    var t = 0;
    for (var i = 0; i < measures.length; i++) {
        t = t + duration2time(measures[i].tempo, duration384(measures[i].meter));
    }
    return t;
}
function time2Duration(time, bpm) {
    var n4 = 60 / bpm;
    var n384 = n4 / 96;
    return Math.round(time / n384);
}
function duration384(meter) {
    return meter.count * (384 / meter.division);
}
var UndoRedoKeys;
(function (UndoRedoKeys) {
    UndoRedoKeys["undoRedoChangeProjectTitle"] = "changeProjectTitle";
    UndoRedoKeys["undoRedoChangeProjectDescription"] = "changeProjectDescription";
    UndoRedoKeys["undoRedoSelectLayer"] = "selectLayer";
    UndoRedoKeys["undoRedoDisableTrack"] = "disableTrack";
    UndoRedoKeys["undoRedoDisableSongFx"] = "disableSongFx";
    UndoRedoKeys["undoRedoDisableTrackFx"] = "disableTrackFx";
    UndoRedoKeys["undoRedoDisableVoice"] = "disableSongVoice";
    UndoRedoKeys["undoRedoDisableVoiceFx"] = "disableVoiceFx";
    UndoRedoKeys["undoRedoBunch"] = "bunch";
})(UndoRedoKeys || (UndoRedoKeys = {}));
;
