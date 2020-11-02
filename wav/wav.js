const fs = require('fs');
const path = require('path');
const C = require('construct-js');

function writeWav(soundData, filename, sampleRate) {
    const riffChunkStruct = C.Struct('riffChunk')
        .field('magic', C.RawString('RIFF'))
        .field('size', C.U32LE(0))
        .field('fmtName', C.RawString('WAVE'));

    const fmtSubChunkStruct = C.Struct('fmtSubChunk')
        .field('id', C.RawString('fmt '))
        .field('subChunk1Size', C.U32LE(0))
        .field('audioFormat', C.U16LE(1))
        .field('numChannels', C.U16LE(1))
        .field('sampleRate', C.U32LE(sampleRate))
        .field('byteRate', C.U32LE(sampleRate*2))
        .field('blockAlign', C.U16LE(2))
        .field('bitsPerSample', C.U16LE(16));

    const totalSubChuckSize = fmtSubChunkStruct.computeBufferSize();
    fmtSubChunkStruct.get('subChunk1Size').set(totalSubChuckSize - 8);

    const dataSubChunkStruct = C.Struct('dataSubChunk')
        .field('id', C.RawString('data'))
        .field('size', C.U32LE(0))
        .field('data', C.S16LEs([0]));


    //const soundData = generateSoundData();
    dataSubChunkStruct.get('data').set(soundData);
    dataSubChunkStruct.get('size').set(soundData.length*2); // 2 bytes per value

    const fileStruct = C.Struct('waveFile')
        .field('riffChunk', riffChunkStruct)
        .field('fmtSubChunk', fmtSubChunkStruct)
        .field('dataSubChunk', dataSubChunkStruct);

    fs.writeFileSync(path.join(__dirname, `/${filename}`), fileStruct.toBuffer());
}

function createSilence({sampleRate, duration}) {
    const data = [];
    let samples = sampleRate * (duration / 1000);
    for (let i = 0; i < samples; i++) {
        data[i] = 0;
    }
    return data;
}

function combine(a, b) {
    const ab = [];
    for (let i = 0; i < a.length; i++) {
        ab[i] = a[i] + b[i]
    }
    return ab;
}

const noteLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const hasSharp = [true, false, true, true, false, true, true];

function getAllNotes() {
    const list = generateAllNotes();
    const notes = {};

    let n = 0;
    let octave = 1;
    for (let i = 0; i < list.length; i++) {
        let letter = noteLetters[n];

        let key = `${letter}${octave}`;
        notes[key] = {freq: list[i], isSharp: false}

        if (hasSharp[n] && i+1 < list.length) {
            i++;
            let key = `${letter}#${octave}`;
            notes[key] = {freq: list[i], isSharp: true}
        }

        // setup for next round
        n += 1;
        if (n >= noteLetters.length) {
            n = 0;
            octave += 1;
        }
    }

    return notes;
}

function generateAllNotes() {
    const ratio = 2**(1/12);
    const a = [];

    let freq = 55; // A1

    for (let i = 1; i < 8; i++) {
        a.push(freq);
        freq *= ratio; // A#
        freq *= ratio; // B
        a.push(freq);
        freq *= ratio; // C
        a.push(freq);
        freq *= ratio; // C#
        freq *= ratio; // D
        a.push(freq);
        freq *= ratio; // D#
        freq *= ratio; // E
        a.push(freq);
        freq *= ratio; // F
        a.push(freq);
        freq *= ratio; // F#
        freq *= ratio; // G
        a.push(freq);
        freq *= ratio; // G#

        freq *= ratio; // A
    }

    return a;
}

function createTone(sampleRate, duration, freq, amp) {

    const data = [];
    let samples = sampleRate * (duration / 1000);

    // sampleRate = 44100 times per second
    // freq = 100 times per second
    let waveLength = Math.floor(sampleRate / freq);

    for (let i = 0; i < samples; i++) {
        let volume = amp;
        let angle = ((i % waveLength) / waveLength) * Math.PI * 2;
        let amplitude = Math.sin(angle) * volume;
        data.push(amplitude);
    }
    return data;
}

exports.writeWav = writeWav;
exports.createSilence = createSilence;
exports.createTone = createTone;
exports.generateAllNotes = generateAllNotes;
exports.getAllNotes = getAllNotes;