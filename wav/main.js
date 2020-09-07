const fs = require('fs');
const path = require('path');
const C = require('construct-js');

const sampleRate = 192000;// 96000;

generateWav();

function generateWav() {
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


    const soundData = generateSoundData();
    dataSubChunkStruct.get('data').set(soundData);
    dataSubChunkStruct.get('size').set(soundData.length*2); // 2 bytes per value

    const fileStruct = C.Struct('waveFile')
        .field('riffChunk', riffChunkStruct)
        .field('fmtSubChunk', fmtSubChunkStruct)
        .field('dataSubChunk', dataSubChunkStruct);

    fs.writeFileSync(path.join(__dirname, '/new.wav'), fileStruct.toBuffer());
}

function combine(a, b) {
    const ab = [];
    for (let i = 0; i < a.length; i++) {
        ab[i] = a[i] + b[i]
    }
    return ab;
}



function generateSoundData() {

    let ratio = 2**(1/12);
    let a4 = 440;
    let b4 = a4 * ratio * ratio;
    let c5 = b4 * ratio;
    let d5 = c5 * ratio * ratio;


    let duration = 100;

    const a = getNote(sampleRate, duration, a4);
    const b = getNote(sampleRate, duration, b4);
    const c = getNote(sampleRate, duration, c5);

    const ab = combine(a, b);
    const ac = combine(a, c);
    const bc = combine(b, c);
    const abc = combine(ab, c);
    const silence = getSilence(sampleRate, duration);

    let data = [];

    for (let i = 1; i < 400; i++) {
        let o = silence;

        if (i % 2 === 0) {
            o = a;
            if (i % 3 === 0) {
                o = ab;
                if (i % 5 === 0) {
                    o = abc;
                }
            }
        }
        else if (i % 3 === 0) {
            o = b;
            if (i % 5 === 0) {
                o = bc;
            }
        }
        else if (i % 5 === 0) {
            o = c;
        }

        data.push(...o);
    }

    // apply max volume
    let max = 32767;
    max = max / 3;
    data = data.map(v => {return v * max;});

    return data;
}

function getSilence(sampleRate, duration) {
    const data = [];
    let samples = sampleRate * (duration / 1000);
    for (let i = 0; i < samples; i++) {
        data[i] = 0;
    }
    return data;
}

// TODO, need to create a get period which includes the previous and next notes, so we can know which to sustain and which to release
/*

* -> a -> ab
a gets attack/decay, no release

a -> ab -> b
b gets an attack/decay, no release
a gets a release

ab -> b -> *
b gets release

 */


function getNote(sampleRate, duration, freq) {
    const data = [];
    let samples = sampleRate * (duration / 1000);

    // sampleRate = 44100 times per second
    // freq = 100 times per second
    //
    let waveLength = Math.floor(sampleRate / freq);

    let attack = 0.01;
    let decay = 0.1;
    let release = 0.1;
    let sustain = 1 - attack - decay - release;

    let attackVolume = 1;
    let sustainVolume = 0.6;

    for (let i = 0; i < samples; i++) {

        let volume = 1;

        let p = i / samples;
        // attack
        if (p < attack) {
            volume = attackVolume * p/attack;
        }
        else if (p < attack + decay) {
            p -= attack;
            volume = attackVolume - (p/decay) * (attackVolume-sustainVolume);
        }
        else if (p < attack + decay + sustain) {
            volume = sustainVolume;
        }
        else {
            p -= attack + decay + sustain;
            volume = (1-p/release) * sustainVolume;
        }

        let a0 = ((i % waveLength) / waveLength) * Math.PI * 2;

        let v0 = Math.sin(a0) * volume;
        data.push(v0);
    }
    return data;
}

// ADSR