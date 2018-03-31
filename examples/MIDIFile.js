(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.MIDIFile = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// MIDIEvents : Read and edit events from various sources (ArrayBuffer, Stream)
function MIDIEvents() {
  throw new Error('MIDIEvents function not intended to be run.');
}

// Static constants
// Event types
MIDIEvents.EVENT_META = 0xFF;
MIDIEvents.EVENT_SYSEX = 0xF0;
MIDIEvents.EVENT_DIVSYSEX = 0xF7;
MIDIEvents.EVENT_MIDI = 0x8;
// Meta event types
MIDIEvents.EVENT_META_SEQUENCE_NUMBER = 0x00;
MIDIEvents.EVENT_META_TEXT = 0x01;
MIDIEvents.EVENT_META_COPYRIGHT_NOTICE = 0x02;
MIDIEvents.EVENT_META_TRACK_NAME = 0x03;
MIDIEvents.EVENT_META_INSTRUMENT_NAME = 0x04;
MIDIEvents.EVENT_META_LYRICS = 0x05;
MIDIEvents.EVENT_META_MARKER = 0x06;
MIDIEvents.EVENT_META_CUE_POINT = 0x07;
MIDIEvents.EVENT_META_MIDI_CHANNEL_PREFIX = 0x20;
MIDIEvents.EVENT_META_END_OF_TRACK = 0x2F;
MIDIEvents.EVENT_META_SET_TEMPO = 0x51;
MIDIEvents.EVENT_META_SMTPE_OFFSET = 0x54;
MIDIEvents.EVENT_META_TIME_SIGNATURE = 0x58;
MIDIEvents.EVENT_META_KEY_SIGNATURE = 0x59;
MIDIEvents.EVENT_META_SEQUENCER_SPECIFIC = 0x7F;
// MIDI event types
MIDIEvents.EVENT_MIDI_NOTE_OFF = 0x8;
MIDIEvents.EVENT_MIDI_NOTE_ON = 0x9;
MIDIEvents.EVENT_MIDI_NOTE_AFTERTOUCH = 0xA;
MIDIEvents.EVENT_MIDI_CONTROLLER = 0xB;
MIDIEvents.EVENT_MIDI_PROGRAM_CHANGE = 0xC;
MIDIEvents.EVENT_MIDI_CHANNEL_AFTERTOUCH = 0xD;
MIDIEvents.EVENT_MIDI_PITCH_BEND = 0xE;
// MIDI event sizes
MIDIEvents.MIDI_1PARAM_EVENTS = [
  MIDIEvents.EVENT_MIDI_PROGRAM_CHANGE,
  MIDIEvents.EVENT_MIDI_CHANNEL_AFTERTOUCH,
];
MIDIEvents.MIDI_2PARAMS_EVENTS = [
  MIDIEvents.EVENT_MIDI_NOTE_OFF,
  MIDIEvents.EVENT_MIDI_NOTE_ON,
  MIDIEvents.EVENT_MIDI_NOTE_AFTERTOUCH,
  MIDIEvents.EVENT_MIDI_CONTROLLER,
  MIDIEvents.EVENT_MIDI_PITCH_BEND,
];

// Create an event stream parser
MIDIEvents.createParser = function midiEventsCreateParser(stream, startAt, strictMode) {
  // Private vars
  // Common vars
  var eventTypeByte;
  var event;
  // MIDI events vars
  var MIDIEventType;
  var MIDIEventChannel;
  var MIDIEventParam1;

  // Wrap DataView into a data stream
  if(stream instanceof DataView) {
    stream = {
      position: startAt || 0,
      buffer: stream,
      readUint8: function() {
        return this.buffer.getUint8(this.position++);
      },
      readUint16: function() {
        var v = this.buffer.getUint16(this.position);
        this.position = this.position + 2;
        return v;
      },
      readUint32: function() {
        var v = this.buffer.getUint16(this.position);
        this.position = this.position + 2;
        return v;
      },
      readVarInt: function() {
        var v = 0;
        var i = 0;
        var b;

        while(4 > i++) {
          b = this.readUint8();

          if (b & 0x80) {
            v += (b & 0x7f);
            v <<= 7;
          } else {
            return v + b;
          }
        }
        throw new Error('0x' + this.position.toString(16) + ':' +
          ' Variable integer length cannot exceed 4 bytes');
      },
      readBytes: function(length) {
        var bytes = [];

        for(; 0 < length; length--) {
          bytes.push(this.readUint8());
        }
        return bytes;
      },
      pos: function() {
        return '0x' + (this.buffer.byteOffset + this.position).toString(16);
      },
      end: function() {
        return this.position === this.buffer.byteLength;
      },
    };
    startAt = 0;
  }
  // Consume stream till not at start index
  if(0 < startAt) {
    while(startAt--) {
      stream.readUint8();
    }
  }
  // creating the parser object
  return {
    // Read the next event
    next: function() {
      // Check available datas
      if(stream.end()) {
        return null;
      }
      // Creating the event
      event = {
        // Memoize the event index
        index: stream.pos(),
        // Read the delta time
        delta: stream.readVarInt(),
      };
      // Read the eventTypeByte
      eventTypeByte = stream.readUint8();
      if(0xF0 === (eventTypeByte & 0xF0)) {
        // Meta events
        if(eventTypeByte === MIDIEvents.EVENT_META) {
          event.type = MIDIEvents.EVENT_META;
          event.subtype = stream.readUint8();
          event.length = stream.readVarInt();
          switch(event.subtype) {
            case MIDIEvents.EVENT_META_SEQUENCE_NUMBER:
              if(strictMode && 2 !== event.length) {
                throw new Error(stream.pos() + ' Bad metaevent length.');
              }
              event.msb = stream.readUint8();
              event.lsb = stream.readUint8();
              return event;
            case MIDIEvents.EVENT_META_TEXT:
            case MIDIEvents.EVENT_META_COPYRIGHT_NOTICE:
            case MIDIEvents.EVENT_META_TRACK_NAME:
            case MIDIEvents.EVENT_META_INSTRUMENT_NAME:
            case MIDIEvents.EVENT_META_LYRICS:
            case MIDIEvents.EVENT_META_MARKER:
            case MIDIEvents.EVENT_META_CUE_POINT:
              event.data = stream.readBytes(event.length);
              return event;
            case MIDIEvents.EVENT_META_MIDI_CHANNEL_PREFIX:
              if(strictMode && 1 !== event.length) {
                throw new Error(stream.pos() + ' Bad metaevent length.');
              }
              event.prefix = stream.readUint8();
              return event;
            case MIDIEvents.EVENT_META_END_OF_TRACK:
              if(strictMode && 0 !== event.length) {
                throw new Error(stream.pos() + ' Bad metaevent length.');
              }
              return event;
            case MIDIEvents.EVENT_META_SET_TEMPO:
              if(strictMode && 3 !== event.length) {
                throw new Error(stream.pos() + ' Tempo meta event length must be 3.');
              }
              event.tempo = (
                (stream.readUint8() << 16) +
                (stream.readUint8() << 8) +
                stream.readUint8()
              );
              event.tempoBPM = 60000000 / event.tempo;
              return event;
            case MIDIEvents.EVENT_META_SMTPE_OFFSET:
              if(strictMode && 5 !== event.length) {
                throw new Error(stream.pos() + ' Bad metaevent length.');
              }
              event.hour = stream.readUint8();
              if(strictMode && 23 < event.hour) {
                throw new Error(stream.pos() + ' SMTPE offset hour value must' +
                  ' be part of 0-23.');
              }
              event.minutes = stream.readUint8();
              if(strictMode && 59 < event.minutes) {
                throw new Error(stream.pos() + ' SMTPE offset minutes value' +
                  ' must be part of 0-59.');
              }
              event.seconds = stream.readUint8();
              if(strictMode && 59 < event.seconds) {
                throw new Error(stream.pos() + ' SMTPE offset seconds value' +
                  ' must be part of 0-59.');
              }
              event.frames = stream.readUint8();
              if(strictMode && 30 < event.frames) {
                throw new Error(stream.pos() + ' SMTPE offset frames value must' +
                  ' be part of 0-30.');
              }
              event.subframes = stream.readUint8();
              if(strictMode && 99 < event.subframes) {
                throw new Error(stream.pos() + ' SMTPE offset subframes value' +
                  ' must be part of 0-99.');
              }
              return event;
            case MIDIEvents.EVENT_META_KEY_SIGNATURE:
              if(strictMode && 2 !== event.length) {
                throw new Error(stream.pos() + ' Bad metaevent length.');
              }
              event.key = stream.readUint8();
              if(strictMode && (-7 > event.key || 7 < event.key)) {
                throw new Error(stream.pos() + ' Bad metaevent length.');
              }
              event.scale = stream.readUint8();
              if(strictMode && 0 !== event.scale && 1 !== event.scale) {
                throw new Error(stream.pos() + ' Key signature scale value must' +
                  ' be 0 or 1.');
              }
              return event;
            case MIDIEvents.EVENT_META_TIME_SIGNATURE:
              if(strictMode && 4 !== event.length) {
                throw new Error(stream.pos() + ' Bad metaevent length.');
              }
              event.data = stream.readBytes(event.length);
              event.param1 = event.data[0];
              event.param2 = event.data[1];
              event.param3 = event.data[2];
              event.param4 = event.data[3];
              return event;
            case MIDIEvents.EVENT_META_SEQUENCER_SPECIFIC:
              event.data = stream.readBytes(event.length);
              return event;
            default:
              if(strictMode) {
                throw new Error(stream.pos() + ' Unknown meta event type ' +
                  '(' + event.subtype.toString(16) + ').');
              }
              event.data = stream.readBytes(event.length);
              return event;
          }
        // System events
        } else if(eventTypeByte === MIDIEvents.EVENT_SYSEX ||
            eventTypeByte === MIDIEvents.EVENT_DIVSYSEX) {
          event.type = eventTypeByte;
          event.length = stream.readVarInt();
          event.data = stream.readBytes(event.length);
          return event;
        // Unknown event, assuming it's system like event
        } else {
          if(strictMode) {
            throw new Error(stream.pos() + ' Unknown event type ' +
              eventTypeByte.toString(16) + ', Delta: ' + event.delta + '.');
          }
          event.type = eventTypeByte;
          event.badsubtype = stream.readVarInt();
          event.length = stream.readUint8();
          event.data = stream.readBytes(event.length);
          return event;
        }
      // MIDI eventsdestination[index++]
      } else {
        // running status
        if(0 === (eventTypeByte & 0x80)) {
          if(!(MIDIEventType)) {
            throw new Error(stream.pos() + ' Running status without previous event');
          }
          MIDIEventParam1 = eventTypeByte;
        } else {
          MIDIEventType = eventTypeByte >> 4;
          MIDIEventChannel = eventTypeByte & 0x0F;
          MIDIEventParam1 = stream.readUint8();
        }
        event.type = MIDIEvents.EVENT_MIDI;
        event.subtype = MIDIEventType;
        event.channel = MIDIEventChannel;
        event.param1 = MIDIEventParam1;
        switch(MIDIEventType) {
          case MIDIEvents.EVENT_MIDI_NOTE_OFF:
            event.param2 = stream.readUint8();
            return event;
          case MIDIEvents.EVENT_MIDI_NOTE_ON:
            event.param2 = stream.readUint8();

            // If velocity is 0, it's a note off event in fact
            if(!event.param2) {
              event.subtype = MIDIEvents.EVENT_MIDI_NOTE_OFF;
              event.param2 = 127; // Find a standard telling what to do here
            }
            return event;
          case MIDIEvents.EVENT_MIDI_NOTE_AFTERTOUCH:
            event.param2 = stream.readUint8();
            return event;
          case MIDIEvents.EVENT_MIDI_CONTROLLER:
            event.param2 = stream.readUint8();
            return event;
          case MIDIEvents.EVENT_MIDI_PROGRAM_CHANGE:
            return event;
          case MIDIEvents.EVENT_MIDI_CHANNEL_AFTERTOUCH:
            return event;
          case MIDIEvents.EVENT_MIDI_PITCH_BEND:
            event.param2 = stream.readUint8();
            return event;
          default:
            if(strictMode) {
              throw new Error(stream.pos() + ' Unknown MIDI event type ' +
                '(' + MIDIEventType.toString(16) + ').');
            }
            return event;
        }
      }
    },
  };
};

// Return the buffer length needed to encode the given events
MIDIEvents.writeToTrack = function midiEventsWriteToTrack(events, destination, strictMode) {
  var index = 0;
  var i;
  var j;
  var k;
  var l;

  // Converting each event to binary MIDI datas
  for(i = 0, j = events.length; i < j; i++) {
    // Writing delta value
    if(events[i].delta >>> 28) {
      throw Error('Event #' + i + ': Maximum delta time value reached (' +
        events[i].delta + '/134217728 max)');
    }
    if(events[i].delta >>> 21) {
      destination[index++] = ((events[i].delta >>> 21) & 0x7F) | 0x80;
    }
    if(events[i].delta >>> 14) {
      destination[index++] = ((events[i].delta >>> 14) & 0x7F) | 0x80;
    }
    if(events[i].delta >>> 7) {
      destination[index++] = ((events[i].delta >>> 7) & 0x7F) | 0x80;
    }
    destination[index++] = (events[i].delta & 0x7F);
    // MIDI Events encoding
    if(events[i].type === MIDIEvents.EVENT_MIDI) {
      // Adding the byte of subtype + channel
      destination[index++] = (events[i].subtype << 4) + events[i].channel;
      // Adding the byte of the first params
      destination[index++] = events[i].param1;
      // Adding a byte for the optionnal second param
      if(-1 !== MIDIEvents.MIDI_2PARAMS_EVENTS.indexOf(events[i].subtype)) {
        destination[index++] = events[i].param2;
      }
    // META / SYSEX events encoding
    } else {
      // Adding the event type byte
      destination[index++] = events[i].type;
      // Adding the META event subtype byte
      if(events[i].type === MIDIEvents.EVENT_META) {
        destination[index++] = events[i].subtype;
      }
      // Writing the event length bytes
      if(events[i].length >>> 28) {
        throw Error('Event #' + i + ': Maximum length reached (' +
          events[i].length + '/134217728 max)');
      }
      if(events[i].length >>> 21) {
        destination[index++] = ((events[i].length >>> 21) & 0x7F) | 0x80;
      }
      if(events[i].length >>> 14) {
        destination[index++] = ((events[i].length >>> 14) & 0x7F) | 0x80;
      }
      if(events[i].length >>> 7) {
        destination[index++] = ((events[i].length >>> 7) & 0x7F) | 0x80;
      }
      destination[index++] = (events[i].length & 0x7F);
      if(events[i].type === MIDIEvents.EVENT_META) {
        switch(events[i].subtype) {
          case MIDIEvents.EVENT_META_SEQUENCE_NUMBER:
            destination[index++] = events[i].msb;
            destination[index++] = events[i].lsb;
            break;
          case MIDIEvents.EVENT_META_TEXT:
          case MIDIEvents.EVENT_META_COPYRIGHT_NOTICE:
          case MIDIEvents.EVENT_META_TRACK_NAME:
          case MIDIEvents.EVENT_META_INSTRUMENT_NAME:
          case MIDIEvents.EVENT_META_LYRICS:
          case MIDIEvents.EVENT_META_MARKER:
          case MIDIEvents.EVENT_META_CUE_POINT:
            for(k = 0, l = events[i].length; k < l; k++) {
              destination[index++] = events[i].data[k];
            }
            break;
          case MIDIEvents.EVENT_META_MIDI_CHANNEL_PREFIX:
            destination[index++] = events[i].prefix;
            break;
          case MIDIEvents.EVENT_META_END_OF_TRACK:
            break;
          case MIDIEvents.EVENT_META_SET_TEMPO:
            destination[index++] = (events[i].tempo >> 16);
            destination[index++] = (events[i].tempo >> 8) & 0xFF;
            destination[index++] = events[i].tempo & 0xFF;
            break;
          case MIDIEvents.EVENT_META_SMTPE_OFFSET:
            if(strictMode && 23 < events[i].hour) {
              throw new Error('Event #' + i + ': SMTPE offset hour value must be' +
                ' part of 0-23.');
            }
            destination[index++] = events[i].hour;
            if(strictMode && 59 < events[i].minutes) {
              throw new Error('Event #' + i + ': SMTPE offset minutes value must' +
                ' be part of 0-59.');
            }
            destination[index++] = events[i].minutes;
            if(strictMode && 59 < events[i].seconds) {
              throw new Error('Event #' + i + ': SMTPE offset seconds value must' +
                ' be part of 0-59.');
            }
            destination[index++] = events[i].seconds;
            if(strictMode && 30 < events[i].frames) {
              throw new Error('Event #' + i + ': SMTPE offset frames amount must' +
                ' be part of 0-30.');
            }
            destination[index++] = events[i].frames;
            if(strictMode && 99 < events[i].subframes) {
              throw new Error('Event #' + i + ': SMTPE offset subframes amount' +
                ' must be part of 0-99.');
            }
            destination[index++] = events[i].subframes;
            break;
          case MIDIEvents.EVENT_META_KEY_SIGNATURE:
            if('number' != typeof events[i].key || -7 > events[i].key ||
              7 < events[i].scale) {
              throw new Error('Event #' + i + ':The key signature key must be' +
                ' between -7 and 7');
            }
            if('number' !== typeof events[i].scale ||
              0 > events[i].scale || 1 < events[i].scale) {
              throw new Error('Event #' + i + ':' +
              'The key signature scale must be 0 or 1');
            }
            destination[index++] = events[i].key;
            destination[index++] = events[i].scale;
            break;
          // Not implemented
          case MIDIEvents.EVENT_META_TIME_SIGNATURE:
          case MIDIEvents.EVENT_META_SEQUENCER_SPECIFIC:
          default:
            for(k = 0, l = events[i].length; k < l; k++) {
              destination[index++] = events[i].data[k];
            }
            break;
        }
      // Adding bytes corresponding to the sysex event datas
      } else {
        for(k = 0, l = events[i].length; k < l; k++) {
          destination[index++] = events[i].data[k];
        }
      }
    }
  }
};

// Return the buffer length needed to encode the given events
MIDIEvents.getRequiredBufferLength = function(events) {
  var bufferLength = 0;
  var i = 0;
  var j;

  // Calculating the track size by adding events lengths
  for(i = 0, j = events.length; i < j; i++) {
    // Computing necessary bytes to encode the delta value
    bufferLength +=
      events[i].delta >>> 21 ? 4 :
        events[i].delta >>> 14 ? 3 :
          events[i].delta >>> 7 ? 2 : 1;
    // MIDI Events have various fixed lengths
    if(events[i].type === MIDIEvents.EVENT_MIDI) {
      // Adding a byte for subtype + channel
      bufferLength++;
      // Adding a byte for the first params
      bufferLength++;
      // Adding a byte for the optionnal second param
      if(-1 !== MIDIEvents.MIDI_2PARAMS_EVENTS.indexOf(events[i].subtype)) {
        bufferLength++;
      }
    // META / SYSEX events lengths are self defined
    } else {
      // Adding a byte for the event type
      bufferLength++;
      // Adding a byte for META events subtype
      if(events[i].type === MIDIEvents.EVENT_META) {
        bufferLength++;
      }
      // Adding necessary bytes to encode the length
      bufferLength +=
        events[i].length >>> 21 ? 4 :
          events[i].length >>> 14 ? 3 :
            events[i].length >>> 7 ? 2 : 1;
      // Adding bytes corresponding to the event length
      bufferLength += events[i].length;
    }
  }
  return bufferLength;
};

module.exports = MIDIEvents;

},{}],2:[function(require,module,exports){
/*! http://mths.be/fromcodepoint v0.2.1 by @mathias */
if (!String.fromCodePoint) {
	(function() {
		var defineProperty = (function() {
			// IE 8 only supports `Object.defineProperty` on DOM elements
			try {
				var object = {};
				var $defineProperty = Object.defineProperty;
				var result = $defineProperty(object, object, object) && $defineProperty;
			} catch(error) {}
			return result;
		}());
		var stringFromCharCode = String.fromCharCode;
		var floor = Math.floor;
		var fromCodePoint = function(_) {
			var MAX_SIZE = 0x4000;
			var codeUnits = [];
			var highSurrogate;
			var lowSurrogate;
			var index = -1;
			var length = arguments.length;
			if (!length) {
				return '';
			}
			var result = '';
			while (++index < length) {
				var codePoint = Number(arguments[index]);
				if (
					!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
					codePoint < 0 || // not a valid Unicode code point
					codePoint > 0x10FFFF || // not a valid Unicode code point
					floor(codePoint) != codePoint // not an integer
				) {
					throw RangeError('Invalid code point: ' + codePoint);
				}
				if (codePoint <= 0xFFFF) { // BMP code point
					codeUnits.push(codePoint);
				} else { // Astral code point; split in surrogate halves
					// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
					codePoint -= 0x10000;
					highSurrogate = (codePoint >> 10) + 0xD800;
					lowSurrogate = (codePoint % 0x400) + 0xDC00;
					codeUnits.push(highSurrogate, lowSurrogate);
				}
				if (index + 1 == length || codeUnits.length > MAX_SIZE) {
					result += stringFromCharCode.apply(null, codeUnits);
					codeUnits.length = 0;
				}
			}
			return result;
		};
		if (defineProperty) {
			defineProperty(String, 'fromCodePoint', {
				'value': fromCodePoint,
				'configurable': true,
				'writable': true
			});
		} else {
			String.fromCodePoint = fromCodePoint;
		}
	}());
}

},{}],3:[function(require,module,exports){
/*! http://mths.be/codepointat v0.2.0 by @mathias */
if (!String.prototype.codePointAt) {
	(function() {
		'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
		var defineProperty = (function() {
			// IE 8 only supports `Object.defineProperty` on DOM elements
			try {
				var object = {};
				var $defineProperty = Object.defineProperty;
				var result = $defineProperty(object, object, object) && $defineProperty;
			} catch(error) {}
			return result;
		}());
		var codePointAt = function(position) {
			if (this == null) {
				throw TypeError();
			}
			var string = String(this);
			var size = string.length;
			// `ToInteger`
			var index = position ? Number(position) : 0;
			if (index != index) { // better `isNaN`
				index = 0;
			}
			// Account for out-of-bounds indices:
			if (index < 0 || index >= size) {
				return undefined;
			}
			// Get the first code unit
			var first = string.charCodeAt(index);
			var second;
			if ( // check if it’s the start of a surrogate pair
				first >= 0xD800 && first <= 0xDBFF && // high surrogate
				size > index + 1 // there is a next code unit
			) {
				second = string.charCodeAt(index + 1);
				if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
					// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
					return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
				}
			}
			return first;
		};
		if (defineProperty) {
			defineProperty(String.prototype, 'codePointAt', {
				'value': codePointAt,
				'configurable': true,
				'writable': true
			});
		} else {
			String.prototype.codePointAt = codePointAt;
		}
	}());
}

},{}],4:[function(require,module,exports){
// UTF8 : Manage UTF-8 strings in ArrayBuffers
if(module.require) {
  require('string.fromcodepoint');
  require('string.prototype.codepointat');
}

var UTF8={
  // non UTF8 encoding detection (cf README file for details)
  'isNotUTF8': function(bytes, byteOffset, byteLength) {
    try {
      UTF8.getStringFromBytes(bytes, byteOffset, byteLength, true);
    } catch(e) {
      return true;
    }
    return false;
  },
  // UTF8 decoding functions
  'getCharLength': function(theByte) {
    // 4 bytes encoded char (mask 11110000)
    if(0xF0 == (theByte&0xF0)) {
      return 4;
    // 3 bytes encoded char (mask 11100000)
    } else if(0xE0 == (theByte&0xE0)) {
      return 3;
    // 2 bytes encoded char (mask 11000000)
    } else if(0xC0 == (theByte&0xC0)) {
      return 2;
    // 1 bytes encoded char
    } else if(theByte == (theByte&0x7F)) {
      return 1;
    }
    return 0;
  },
  'getCharCode': function(bytes, byteOffset, charLength) {
    var charCode = 0, mask = '';
    byteOffset = byteOffset || 0;
    // Retrieve charLength if not given
    charLength = charLength || UTF8.getCharLength(bytes[byteOffset]);
    if(charLength == 0) {
      throw new Error(bytes[byteOffset].toString(2)+' is not a significative' +
        ' byte (offset:'+byteOffset+').');
    }
    // Return byte value if charlength is 1
    if(1 === charLength) {
      return bytes[byteOffset];
    }
    // Test UTF8 integrity
    mask = '00000000'.slice(0, charLength) + 1 + '00000000'.slice(charLength + 1);
    if(bytes[byteOffset]&(parseInt(mask, 2))) {
      throw Error('Index ' + byteOffset + ': A ' + charLength + ' bytes' +
        ' encoded char' +' cannot encode the '+(charLength+1)+'th rank bit to 1.');
    }
    // Reading the first byte
    mask='0000'.slice(0,charLength+1)+'11111111'.slice(charLength+1);
    charCode+=(bytes[byteOffset]&parseInt(mask,2))<<((--charLength)*6);
    // Reading the next bytes
    while(charLength) {
      if(0x80!==(bytes[byteOffset+1]&0x80)
        ||0x40===(bytes[byteOffset+1]&0x40)) {
        throw Error('Index '+(byteOffset+1)+': Next bytes of encoded char'
          +' must begin with a "10" bit sequence.');
      }
      charCode += ((bytes[++byteOffset]&0x3F) << ((--charLength) * 6));
    }
    return charCode;
  },
  'getStringFromBytes': function(bytes, byteOffset, byteLength, strict) {
    var charLength, chars = [];
    byteOffset = byteOffset|0;
    byteLength=('number' === typeof byteLength ?
      byteLength :
      bytes.byteLength || bytes.length
    );
    for(; byteOffset < byteLength; byteOffset++) {
      charLength = UTF8.getCharLength(bytes[byteOffset]);
      if(byteOffset + charLength > byteLength) {
        if(strict) {
          throw Error('Index ' + byteOffset + ': Found a ' + charLength +
            ' bytes encoded char declaration but only ' +
            (byteLength - byteOffset) +' bytes are available.');
        }
      } else {
        chars.push(String.fromCodePoint(
          UTF8.getCharCode(bytes, byteOffset, charLength, strict)
        ));
      }
      byteOffset += charLength - 1;
    }
    return chars.join('');
  },
  // UTF8 encoding functions
  'getBytesForCharCode': function(charCode) {
    if(charCode < 128) {
      return 1;
    } else if(charCode < 2048) {
      return 2;
    } else if(charCode < 65536) {
      return 3;
    } else if(charCode < 2097152) {
      return 4;
    }
    throw new Error('CharCode '+charCode+' cannot be encoded with UTF8.');
  },
  'setBytesFromCharCode': function(charCode, bytes, byteOffset, neededBytes) {
    charCode = charCode|0;
    bytes = bytes || [];
    byteOffset = byteOffset|0;
    neededBytes = neededBytes || UTF8.getBytesForCharCode(charCode);
    // Setting the charCode as it to bytes if the byte length is 1
    if(1 == neededBytes) {
      bytes[byteOffset] = charCode;
    } else {
      // Computing the first byte
      bytes[byteOffset++] =
        (parseInt('1111'.slice(0, neededBytes), 2) << 8 - neededBytes) +
        (charCode >>> ((--neededBytes) * 6));
      // Computing next bytes
      for(;neededBytes>0;) {
        bytes[byteOffset++] = ((charCode>>>((--neededBytes) * 6))&0x3F)|0x80;
      }
    }
    return bytes;
  },
  'setBytesFromString': function(string, bytes, byteOffset, byteLength, strict) {
    string = string || '';
    bytes = bytes || [];
    byteOffset = byteOffset|0;
    byteLength = ('number' === typeof byteLength ?
      byteLength :
      bytes.byteLength||Infinity
    );
    for(var i = 0, j = string.length; i < j; i++) {
      var neededBytes = UTF8.getBytesForCharCode(string[i].codePointAt(0));
      if(strict && byteOffset + neededBytes > byteLength) {
        throw new Error('Not enought bytes to encode the char "' + string[i] +
          '" at the offset "' + byteOffset + '".');
      }
      UTF8.setBytesFromCharCode(string[i].codePointAt(0),
        bytes, byteOffset, neededBytes, strict);
      byteOffset += neededBytes;
    }
    return bytes;
  }
};

if('undefined' !== typeof module) {
  module.exports = UTF8;
}


},{"string.fromcodepoint":2,"string.prototype.codepointat":3}],5:[function(require,module,exports){
'use strict';

// MIDIFile : Read (and soon edit) a MIDI file in a given ArrayBuffer

// Dependencies
var MIDIFileHeader = require('./MIDIFileHeader');
var MIDIFileTrack = require('./MIDIFileTrack');
var MIDIEvents = require('midievents');
var UTF8 = require('utf-8');

// Constructor
function MIDIFile(buffer, strictMode) {
  var track;
  var curIndex;
  var i;
  var j;

  // If not buffer given, creating a new MIDI file
  if(!buffer) {
    // Creating the content
    this.header = new MIDIFileHeader();
    this.tracks = [new MIDIFileTrack()];
  // if a buffer is provided, parsing him
  } else {
    if(!(buffer instanceof ArrayBuffer)) {
      throw new Error('Invalid buffer received.');
    }
    // Minimum MIDI file size is a headerChunk size (14bytes)
    // and an empty track (8+3bytes)
    if(25 > buffer.byteLength) {
      throw new Error('A buffer of a valid MIDI file must have, at least, a' +
        ' size of 25bytes.');
    }
    // Reading header
    this.header = new MIDIFileHeader(buffer, strictMode);
    this.tracks = [];
    curIndex = MIDIFileHeader.HEADER_LENGTH;
    // Reading tracks
    for(i = 0, j = this.header.getTracksCount(); i < j; i++) {
      // Testing the buffer length
      if(strictMode && curIndex >= buffer.byteLength - 1) {
        throw new Error('Couldn\'t find datas corresponding to the track #' + i + '.');
      }
      // Creating the track object
      track = new MIDIFileTrack(buffer, curIndex, strictMode);
      this.tracks.push(track);
      // Updating index to the track end
      curIndex += track.getTrackLength() + 8;
    }
    // Testing integrity : curIndex should be at the end of the buffer
    if(strictMode && curIndex !== buffer.byteLength) {
      throw new Error('It seems that the buffer contains too much datas.');
    }
  }
}

// Events reading helpers
MIDIFile.prototype.getEvents = function(type, subtype) {
  var events;
  var event;
  var playTime = 0;
  var filteredEvents = [];
  var format = this.header.getFormat();
  var tickResolution = this.header.getTickResolution();
  var i;
  var j;
  var trackParsers;
  var smallestDelta;

  // Reading events
  // if the read is sequential
  if(1 !== format || 1 === this.tracks.length) {
    for(i = 0, j = this.tracks.length; i < j; i++) {
      // reset playtime if format is 2
      playTime = (2 === format && playTime ? playTime : 0);
      events = MIDIEvents.createParser(this.tracks[i].getTrackContent(), 0, false);
      // loooping through events
      event = events.next();
      while(event) {
        playTime += event.delta ? (event.delta * tickResolution) / 1000 : 0;
        if(event.type === MIDIEvents.EVENT_META) {
          // tempo change events
          if(event.subtype === MIDIEvents.EVENT_META_SET_TEMPO) {
            tickResolution = this.header.getTickResolution(event.tempo);
          }
        }
        // push the asked events
        if(((!type) || event.type === type) &&
          ((!subtype) || (event.subtype && event.subtype === subtype))) {
          event.playTime = playTime;
          filteredEvents.push(event);
        }
        event = events.next();
      }
    }
  // the read is concurrent
  } else {
    trackParsers = [];
    smallestDelta = -1;

    // Creating parsers
    for(i = 0, j = this.tracks.length; i < j; i++) {
      trackParsers[i] = {};
      trackParsers[i].parser = MIDIEvents.createParser(
          this.tracks[i].getTrackContent(), 0, false);
      trackParsers[i].curEvent = trackParsers[i].parser.next();
    }
    // Filling events
    do {
      smallestDelta = -1;
      // finding the smallest event
      for(i = 0, j = trackParsers.length; i < j; i++) {
        if(trackParsers[i].curEvent) {
          if(-1 === smallestDelta || trackParsers[i].curEvent.delta <
            trackParsers[smallestDelta].curEvent.delta) {
            smallestDelta = i;
          }
        }
      }
      if(-1 !== smallestDelta) {
        // removing the delta of previous events
        for(i = 0, j = trackParsers.length; i < j; i++) {
          if(i !== smallestDelta && trackParsers[i].curEvent) {
            trackParsers[i].curEvent.delta -= trackParsers[smallestDelta].curEvent.delta;
          }
        }
        // filling values
        event = trackParsers[smallestDelta].curEvent;
        playTime += (event.delta ? (event.delta * tickResolution) / 1000 : 0);
        if(event.type === MIDIEvents.EVENT_META) {
          // tempo change events
          if(event.subtype === MIDIEvents.EVENT_META_SET_TEMPO) {
            tickResolution = this.header.getTickResolution(event.tempo);
          }
        }
        // push midi events
        if(((!type) || event.type === type) &&
          ((!subtype) || (event.subtype && event.subtype === subtype))) {
          event.playTime = playTime;
          event.track = smallestDelta;
          filteredEvents.push(event);
        }
        // getting next event
        trackParsers[smallestDelta].curEvent = trackParsers[smallestDelta].parser.next();
      }
    } while(-1 !== smallestDelta);
  }
  return filteredEvents;
};

MIDIFile.prototype.getMidiEvents = function() {
  return this.getEvents(MIDIEvents.EVENT_MIDI);
};

MIDIFile.prototype.getLyrics = function() {
  var events = this.getEvents(MIDIEvents.EVENT_META);
  var texts = [];
  var lyrics = [];
  var event;
  var i;
  var j;

  for(i = 0, j = events.length; i < j; i++) {
    event = events[i];
    // Lyrics
    if(event.subtype === MIDIEvents.EVENT_META_LYRICS) {
      lyrics.push(event);
    // Texts
    } else if(event.subtype === MIDIEvents.EVENT_META_TEXT) {
      // Ignore special texts
      if('@' === String.fromCharCode(event.data[0])) {
        if('T' === String.fromCharCode(event.data[1])) {
          // console.log('Title : ' + event.text.substring(2));
        } else if('I' === String.fromCharCode(event.data[1])) {
          // console.log('Info : ' + event.text.substring(2));
        } else if('L' === String.fromCharCode(event.data[1])) {
          // console.log('Lang : ' + event.text.substring(2));
        }
      // karaoke text follows, remove all previous text
      } else if(0 === String.fromCharCode.apply(String, event.data).indexOf('words')) {
        texts.length = 0;
        // console.log('Word marker found');
      // Karaoke texts
      // If playtime is greater than 0
      } else if(0 !== event.playTime) {
        texts.push(event);
      }
    }
  }
  // Choosing the right lyrics
  if(2 < lyrics.length) {
    texts = lyrics;
  } else if(!texts.length) {
    texts = [];
  }
  // Convert texts and detect encoding
  try {
    texts.forEach(function(event) {
      event.text = UTF8.getStringFromBytes(event.data, 0, event.length, true);
    });
  } catch (e) {
    texts.forEach(function(event) {
      event.text = event.data.map(function(c) {
        return String.fromCharCode(c);
      }).join('');
    });
  }
  return texts;
};

// Basic events reading
MIDIFile.prototype.getTrackEvents = function(index) {
  var event;
  var events = [];
  var parser;
  if(index > this.tracks.length || 0 > index) {
    throw Error('Invalid track index (' + index + ')');
  }
  parser = MIDIEvents.createParser(
    this.tracks[index].getTrackContent(), 0, false
  );
  event = parser.next();
  do {
    events.push(event);
    event = parser.next();
  } while(event);
  return events;
};

// Basic events writting
MIDIFile.prototype.setTrackEvents = function(index, events) {
  var bufferLength;
  var destination;

  if(index > this.tracks.length || 0 > index) {
    throw Error('Invalid track index (' + index + ')');
  }
  if((!events) || (!events.length)) {
    throw Error('A track must contain at least one event, none given.');
  }
  bufferLength = MIDIEvents.getRequiredBufferLength(events);
  destination = new Uint8Array(bufferLength);
  MIDIEvents.writeToTrack(events, destination);
  this.tracks[index].setTrackContent(destination);
};

// Remove a track
MIDIFile.prototype.deleteTrack = function(index) {
  if(index > this.tracks.length || 0 > index) {
    throw Error('Invalid track index (' + index + ')');
  }
  this.tracks.splice(index, 1);
  this.header.setTracksCount(this.tracks.length);
};

// Add a track
MIDIFile.prototype.addTrack = function(index) {
  var track;

  if(index > this.tracks.length || 0 > index) {
    throw Error('Invalid track index (' + index + ')');
  }
  track = new MIDIFileTrack();
  if(index === this.tracks.length) {
    this.tracks.push(track);
  } else {
    this.tracks.splice(index, 0, track);
  }
  this.header.setTracksCount(this.tracks.length);
};

// Retrieve the content in a buffer
MIDIFile.prototype.getContent = function() {
  var bufferLength;
  var destination;
  var origin;
  var i;
  var j;
  var k;
  var l;
  var m;
  var n;

  // Calculating the buffer content
  // - initialize with the header length
  bufferLength = MIDIFileHeader.HEADER_LENGTH;
  // - add tracks length
  for(i = 0, j = this.tracks.length; i < j; i++) {
    bufferLength += this.tracks[i].getTrackLength() + 8;
  }
  // Creating the destination buffer
  destination = new Uint8Array(bufferLength);
  // Adding header
  origin = new Uint8Array(this.header.datas.buffer,
    this.header.datas.byteOffset,
    MIDIFileHeader.HEADER_LENGTH);
  for(i = 0, j = MIDIFileHeader.HEADER_LENGTH; i < j; i++) {
    destination[i] = origin[i];
  }
  // Adding tracks
  for(k = 0, l = this.tracks.length; k < l; k++) {
    origin = new Uint8Array(this.tracks[k].datas.buffer,
      this.tracks[k].datas.byteOffset,
      this.tracks[k].datas.byteLength);
    for(m = 0, n = this.tracks[k].datas.byteLength; m < n; m++) {
      destination[i++] = origin[m];
    }
  }
  return destination.buffer;
};

// Exports Track/Header constructors
MIDIFile.Header = MIDIFileHeader;
MIDIFile.Track = MIDIFileTrack;

module.exports = MIDIFile;

},{"./MIDIFileHeader":6,"./MIDIFileTrack":7,"midievents":1,"utf-8":4}],6:[function(require,module,exports){
'use strict';

// MIDIFileHeader : Read and edit a MIDI header chunk in a given ArrayBuffer
function MIDIFileHeader(buffer) {
  let a;
  // No buffer creating him
  if(!buffer) {
    a = new Uint8Array(MIDIFileHeader.HEADER_LENGTH);
    // Adding the header id (MThd)
    a[0] = 0x4D; a[1] = 0x54; a[2] = 0x68; a[3] = 0x64;
    // Adding the header chunk size
    a[4] = 0x00; a[5] = 0x00; a[6] = 0x00; a[7] = 0x06;
    // Adding the file format (1 here cause it's the most commonly used)
    a[8] = 0x00; a[9] = 0x01;
    // Adding the track count (1 cause it's a new file)
    a[10] = 0x00; a[11] = 0x01;
    // Adding the time division (192 ticks per beat)
    a[12] = 0x00; a[13] = 0xC0;
    // saving the buffer
    this.datas = new DataView(a.buffer, 0, MIDIFileHeader.HEADER_LENGTH);
  // Parsing the given buffer
  } else {
    if(!(buffer instanceof ArrayBuffer)) {
      throw Error('Invalid buffer received.');
    }
    this.datas = new DataView(buffer, 0, MIDIFileHeader.HEADER_LENGTH);
    // Reading MIDI header chunk
    if(!(
      'M' === String.fromCharCode(this.datas.getUint8(0)) &&
      'T' === String.fromCharCode(this.datas.getUint8(1)) &&
      'h' === String.fromCharCode(this.datas.getUint8(2)) &&
      'd' === String.fromCharCode(this.datas.getUint8(3))
    )) {
      throw new Error('Invalid MIDIFileHeader : MThd prefix not found');
    }
    // Reading chunk length
    if(6 !== this.datas.getUint32(4)) {
      throw new Error('Invalid MIDIFileHeader : Chunk length must be 6');
    }
  }
}

// Static constants
MIDIFileHeader.HEADER_LENGTH = 14;
MIDIFileHeader.FRAMES_PER_SECONDS = 1;
MIDIFileHeader.TICKS_PER_BEAT = 2;

// MIDI file format
MIDIFileHeader.prototype.getFormat = function() {
  const format = this.datas.getUint16(8);
  if(0 !== format && 1 !== format && 2 !== format) {
    throw new Error('Invalid MIDI file : MIDI format (' + format + '),' +
      ' format can be 0, 1 or 2 only.');
  }
  return format;
};

MIDIFileHeader.prototype.setFormat = function(format) {
  if(0 !== format && 1 !== format && 2 !== format) {
    throw new Error('Invalid MIDI format given (' + format + '),' +
      ' format can be 0, 1 or 2 only.');
  }
  this.datas.setUint16(8, format);
};

// Number of tracks
MIDIFileHeader.prototype.getTracksCount = function() {
  return this.datas.getUint16(10);
};

MIDIFileHeader.prototype.setTracksCount = function(n) {
  return this.datas.setUint16(10, n);
};

// Tick compute
MIDIFileHeader.prototype.getTickResolution = function(tempo) {
  // Frames per seconds
  if(this.datas.getUint16(12) & 0x8000) {
    return 1000000 / (this.getSMPTEFrames() * this.getTicksPerFrame());
  // Ticks per beat
  }
  // Default MIDI tempo is 120bpm, 500ms per beat
  tempo = tempo || 500000;
  return tempo / this.getTicksPerBeat();
};

// Time division type
MIDIFileHeader.prototype.getTimeDivision = function() {
  if(this.datas.getUint16(12) & 0x8000) {
    return MIDIFileHeader.FRAMES_PER_SECONDS;
  }
  return MIDIFileHeader.TICKS_PER_BEAT;
};

// Ticks per beat
MIDIFileHeader.prototype.getTicksPerBeat = function() {
  var divisionWord = this.datas.getUint16(12);
  if(divisionWord & 0x8000) {
    throw new Error('Time division is not expressed as ticks per beat.');
  }
  return divisionWord;
};

MIDIFileHeader.prototype.setTicksPerBeat = function(ticksPerBeat) {
  this.datas.setUint16(12, ticksPerBeat & 0x7FFF);
};

// Frames per seconds
MIDIFileHeader.prototype.getSMPTEFrames = function() {
  const divisionWord = this.datas.getUint16(12);
  let smpteFrames;

  if(!(divisionWord & 0x8000)) {
    throw new Error('Time division is not expressed as frames per seconds.');
  }
  smpteFrames = divisionWord & 0x7F00;
  if(-1 === [24, 25, 29, 30].indexOf(smpteFrames)) {
    throw new Error('Invalid SMPTE frames value (' + smpteFrames + ').');
  }
  return 29 === smpteFrames ? 29.97 : smpteFrames;
};

MIDIFileHeader.prototype.getTicksPerFrame = function() {
  const divisionWord = this.datas.getUint16(12);

  if(!(divisionWord & 0x8000)) {
    throw new Error('Time division is not expressed as frames per seconds.');
  }
  return divisionWord & 0x00FF;
};

MIDIFileHeader.prototype.setSMTPEDivision = function(smpteFrames, ticksPerFrame) {
  if(29.97 === smpteFrames) {
    smpteFrames = 29;
  }
  if(-1 === [24, 25, 29, 30].indexOf(smpteFrames)) {
    throw new Error('Invalid SMPTE frames value given (' + smpteFrames + ').');
  }
  if(0 > ticksPerFrame || 0xFF < ticksPerFrame) {
    throw new Error('Invalid ticks per frame value given (' + smpteFrames + ').');
  }
  this.datas.setUint8(12, 0x80 | smpteFrames);
  this.datas.setUint8(13, ticksPerFrame);
};

module.exports = MIDIFileHeader;

},{}],7:[function(require,module,exports){
'use strict';

// MIDIFileTrack : Read and edit a MIDI track chunk in a given ArrayBuffer
function MIDIFileTrack(buffer, start) {
  let a;
  let trackLength;

  // no buffer, creating him
  if(!buffer) {
    a = new Uint8Array(12);
    // Adding the empty track header (MTrk)
    a[0] = 0x4D; a[1] = 0x54; a[2] = 0x72; a[3] = 0x6B;
    // Adding the empty track size (4)
    a[4] = 0x00; a[5] = 0x00; a[6] = 0x00; a[7] = 0x04;
    // Adding the track end event
    a[8] = 0x00; a[9] = 0xFF; a[10] = 0x2F; a[11] = 0x00;
    // Saving the buffer
    this.datas = new DataView(a.buffer, 0, MIDIFileTrack.HDR_LENGTH + 4);
  // parsing the given buffer
  } else {
    if(!(buffer instanceof ArrayBuffer)) {
      throw new Error('Invalid buffer received.');
    }
    // Buffer length must size at least like an  empty track (8+3bytes)
    if(12 > buffer.byteLength - start) {
      throw new Error('Invalid MIDIFileTrack (0x' + start.toString(16) + ') :' +
        ' Buffer length must size at least 12bytes');
    }
    // Creating a temporary view to read the track header
    this.datas = new DataView(buffer, start, MIDIFileTrack.HDR_LENGTH);
    // Reading MIDI track header chunk
    if(!(
      'M' === String.fromCharCode(this.datas.getUint8(0)) &&
      'T' === String.fromCharCode(this.datas.getUint8(1)) &&
      'r' === String.fromCharCode(this.datas.getUint8(2)) &&
      'k' === String.fromCharCode(this.datas.getUint8(3))
    )) {
      throw new Error('Invalid MIDIFileTrack (0x' + start.toString(16) + ') :' +
        ' MTrk prefix not found');
    }
    // Reading the track length
    trackLength = this.getTrackLength();
    if(buffer.byteLength - start < trackLength) {
      throw new Error('Invalid MIDIFileTrack (0x' + start.toString(16) + ') :' +
        ' The track size exceed the buffer length.');
    }
    // Creating the final DataView
    this.datas = new DataView(buffer, start, MIDIFileTrack.HDR_LENGTH + trackLength);
    // Trying to find the end of track event
    if(!(
      0xFF === this.datas.getUint8(MIDIFileTrack.HDR_LENGTH + (trackLength - 3)) &&
      0x2F === this.datas.getUint8(MIDIFileTrack.HDR_LENGTH + (trackLength - 2)) &&
      0x00 === this.datas.getUint8(MIDIFileTrack.HDR_LENGTH + (trackLength - 1))
    )) {
      throw new Error('Invalid MIDIFileTrack (0x' + start.toString(16) + ') :' +
        ' No track end event found at the expected index' +
        ' (' + (MIDIFileTrack.HDR_LENGTH + (trackLength - 1)).toString(16) + ').');
    }
  }
}

// Static constants
MIDIFileTrack.HDR_LENGTH = 8;

// Track length
MIDIFileTrack.prototype.getTrackLength = function() {
  return this.datas.getUint32(4);
};

MIDIFileTrack.prototype.setTrackLength = function(trackLength) {
  return this.datas.setUint32(4, trackLength);
};

// Read track contents
MIDIFileTrack.prototype.getTrackContent = function() {
  return new DataView(this.datas.buffer,
    this.datas.byteOffset + MIDIFileTrack.HDR_LENGTH,
    this.datas.byteLength - MIDIFileTrack.HDR_LENGTH);
};

// Set track content
MIDIFileTrack.prototype.setTrackContent = function(dataView) {
  let origin;
  let destination;
  let i;
  let j;
  // Calculating the track length
  const trackLength = dataView.byteLength - dataView.byteOffset;

  // Track length must size at least like an  empty track (4bytes)
  if(4 > trackLength) {
    throw new Error('Invalid track length, must size at least 4bytes');
  }
  this.datas = new DataView(
    new Uint8Array(MIDIFileTrack.HDR_LENGTH + trackLength).buffer);
  // Adding the track header (MTrk)
  this.datas.setUint8(0, 0x4D); // M
  this.datas.setUint8(1, 0x54); // T
  this.datas.setUint8(2, 0x72); // r
  this.datas.setUint8(3, 0x6B); // k
  // Adding the track size
  this.datas.setUint32(4, trackLength);
  // Copying the content
  origin = new Uint8Array(dataView.buffer, dataView.byteOffset,
    dataView.byteLength);
  destination = new Uint8Array(this.datas.buffer,
      MIDIFileTrack.HDR_LENGTH,
      trackLength);
  for(i = 0, j = origin.length; i < j; i++) {
    destination[i] = origin[i];
  }
};

module.exports = MIDIFileTrack;

},{}]},{},[5])(5)
});