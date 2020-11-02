const {writeWav, createSilence, generateAllNotes, getAllNotes, createTone} = require('./wav');

const sampleRate = 48000; // 96000;

const notes = getAllNotes();
const duration = 1000*10;
const primary = notes['A1'].freq;
const maxAmp = 32767;

let combined = null;

for (let n = 1; n <= 22; n++) {

    // create tone
    const data = getTone(primary*n);

    // output
    const filename = 'arcanorum-output/' + (n < 10 ? "0" + n.toString() : n) + ".wav";
    output(data, filename);

    // combine
    if (combined === null) {
        combined = data;
    }
    else {
        combined = combined.map((f, i) => f + data[i]);
    }
}

// now output the combined

const maxValue = combined.reduce((max, f) => Math.max(max, f));
const maxAmpCombined = maxAmp / maxValue;
const dataCombined = combined.map(f => f * maxAmpCombined);
const filename = 'arcanorum-output/all.wav';

console.log('writing ' + filename);
writeWav(dataCombined, filename, sampleRate);

function output(data, filename) {
    // normalize amplitude
    const maxValue = data.reduce((max, f) => Math.max(max, f));
    const dataNormal = data.map(f => f / maxValue);
    // add volume
    const dataWithVolume = dataNormal.map(f => Math.floor(f * maxAmp));
    console.log('writing ' + filename);
    writeWav(dataWithVolume, filename, sampleRate);
}

function getTone(freq) {
    let data = createTone(sampleRate, duration, freq, 1);

    let delta = 0;
    const step = 0.01;
    const threshold = 0.1;
    const maxDelta = 1;
    data = data.map(f => {

        let r = Math.random();

        // move down
        if (r < threshold && delta > -maxDelta) delta -= step;

        // move up
        else if (r > 1-threshold && delta < maxDelta) delta += step;

        return f * (1+delta);
    });

    return data;
}
