const fs = require('fs');
const path = require('path');
const A = require('arcsecond');
const B = require('arcsecond-binary');
const C = require('construct-js');

function getMainHeader(sampleRate) {
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
        .field('id', C.RawString('data'));

    const fileStruct = C.Struct('waveFileHeader')
        .field('riffChunk', riffChunkStruct)
        .field('fmtSubChunk', fmtSubChunkStruct)
        .field('dataSubChunk', dataSubChunkStruct);

    return fileStruct.toBuffer();
}

function getSizeHeader(dataLength, bytesPerValue = 2) {
    const dataSizeSubChunkStruct = C.Struct('dataSizeSubChunk')
        .field('size', C.U32LE(0));

    //const soundData = generateSoundData();
    //dataSubChunkStruct.get('data').set(data);
    dataSizeSubChunkStruct.get('size').set(dataLength*2); // 2 bytes per value

    const fileStruct = C.Struct('waveFileSize')
        .field('dataSubChunk', dataSizeSubChunkStruct);

    return fileStruct.toBuffer();
}

function getWavBuffer(data) {
    const dataSubChunkStruct = C.Struct('dataSubChunk')
        .field('data', C.S16LEs([0]));

    dataSubChunkStruct.get('data').set(data);

    const fileStruct = C.Struct('waveFileSize')
        .field('dataSubChunk', dataSubChunkStruct);

    return fileStruct.toBuffer();
}

const MAINHEADER_LENGTH = 40;

function addBytesToSizeValue(filename, byteCount) {
    // first open & read
    const fd = fs.openSync(filename, "r+");
    const buf = Buffer.alloc(8);
    const bytesRead = fs.readSync(fd, buf, 0, 4, MAINHEADER_LENGTH);
    const currentSize = B.s32LE.run(buf).result;

    // then construct a new header
    const sizeHeader2 = getSizeHeader(currentSize + byteCount);

    // then write & close
    const bytesWritten = fs.writeSync(fd, sizeHeader2, 0, sizeHeader2.length, MAINHEADER_LENGTH);
    fs.closeSync(fd);
}

function writeWav(soundData, filename, sampleRate) {

    // write the initial
    const mainHeader = getMainHeader(sampleRate);
    const sizeHeader = getSizeHeader(soundData.length);
    const wavBuffer = getWavBuffer(soundData);
    fs.writeFileSync(path.join(__dirname, `/${filename}`), mainHeader);
    fs.appendFileSync(path.join(__dirname, `/${filename}`), sizeHeader);
    fs.appendFileSync(path.join(__dirname, `/${filename}`), wavBuffer);

    /*    // let add another second
        // put the data on the end
        fs.appendFileSync(path.join(__dirname, `/${filename}`), wavBuffer);
        fs.appendFileSync(path.join(__dirname, `/${filename}`), wavBuffer);
        fs.appendFileSync(path.join(__dirname, `/${filename}`), wavBuffer);

        addBytesToSizeValue(soundData.length*3);*/
}

function appendWav(soundData, filename, sampleRate) {
    addBytesToSizeValue(filename, soundData.length);
    const wavBuffer = getWavBuffer(soundData);
    fs.appendFileSync(path.join(__dirname, `/${filename}`), wavBuffer);
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

// creates the data for a note at given frequency
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

module.exports = {
    writeWav,
    createSilence,
    createTone,
    generateAllNotes,
    getAllNotes,
    addBytesToSizeValue,
    appendWav
};

if (module.parent === null) {
    const sampleRate = 48000;
    const maxAmp = 32767-3000;
    const data = createTone(sampleRate, 1000, 440, maxAmp);
    writeWav(data, './output/test.wav', sampleRate);
}