const {writeWav, createSilence, generateAllNotes, getAllNotes, createTone} = require('./wav');

const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199];

const sampleRate = 48000; // 96000;

const notes = getAllNotes();
const duration = 1000*10*1;

const maxAmp = 32767-1000;

//makeWavs1();


const chords = [
    //['A1','C1','E1'], // a minor
    //['C1','A1','E1'], // a minor

    ['C1','E1','G1'], // a minor
    //['G1','C1','E1'], // a minor

/*    ['C1','E1','G1'], // C major
    ['D1','F1','A1'], // d minor
    ['E1','G1','B1'], // e minor
    ['F1','A1','C1'], // F major
    ['G1','B1','D1'], // G major

    ['B1','D1','F1'], // b minor diminished*/

    //['A2','C2','E2'], // a minor
]

// a minor
// ACE
// CAE
// CEA

// c major
// CEG
// GCE **


chords.forEach(chord => {
    makeWavs2([chord[0], chord[1], chord[2]]);
    //makeWavs2([chord[0], chord[2], chord[1]]);
    //makeWavs2([chord[1], chord[0], chord[2]]);
    //makeWavs2([chord[1], chord[2], chord[0]]);
    //makeWavs2([chord[2], chord[0], chord[1]]);
    //makeWavs2([chord[2], chord[1], chord[0]]);
})


function makeWavs2(chord) {

    function addToCombined(combined, data) {
        if (combined === null) {
            //combined = data;
            return data.map((f, i) => f);
        }
        else {
            return combined.map((f, i) => f + data[i]);
        }
    }
    
    function createNote(primary, count) {
        let combined = null;
        for (let n = 1; n <= count; n++) {
            // create tone
            const freq = primary * n;
            const data = getToneRandom(freq);

            // calc amp
            let p = (1 - (n-1) / (count-1));
            p = p*p*p;
            let ampMod = p * 0.6 + 0.4;
            const dataMod = data.map(f => f * ampMod)

            // output
            const filename = `arcanorum-output/part-${count}-${(n < 10 ? "0" + n.toString() : n)}.wav`;
            output(dataMod, filename, maxAmp);

            combined = addToCombined(combined, dataMod);
        }
        return combined;
    }

    const freq12 = notes[chord[0]].freq;
    const freq7 = notes[chord[1]].freq;
    const freq3 = notes[chord[2]].freq;

    const c3 = createNote(freq3, 3);
    const c7 = createNote(freq7, 7);
    const c12 = createNote(freq12, 12);

    output(c3,`arcanorum-output/all3_${chord.join('-')}.wav`, maxAmp)
    output(c7,`arcanorum-output/all7_${chord.join('-')}.wav`, maxAmp)
    output(c12,`arcanorum-output/all12_${chord.join('-')}.wav`, maxAmp)

    const combined = c12.map((f, i) => {
        return f + c3[i] + c7[i];
    });

    // now output the combined
    output(combined,`arcanorum-output/all_${chord.join('-')}.wav`, maxAmp)
}

function makeWavs1() {
    let combined = null;
    const primary = notes['A1'].freq;

    for (let n = 1; n <= 22; n++) {

        // create tone

        const freq = primary * n;
        //let cyclesPerSecond = 1 / (freq / 55);
        //const prime = primes[n-1];
        //const data = getTone(freq, prime);
        const data = getToneRandom(freq);

        // output
        const filename = 'arcanorum-output/' + (n < 10 ? "0" + n.toString() : n) + ".wav";
        output(data, filename, maxAmp);

        // combine
        if (combined === null) {
            combined = data;
        }
        else {
            combined = combined.map((f, i) => f + data[i]*((44-n)/44));
        }
    }

    // now output the combined
    output(combined,'arcanorum-output/all.wav', maxAmp)
}




function output(data, filename, maxAmplitude) {
    // normalize amplitude
    const maxValue = data.reduce((max, f) => Math.max(max, f));
    const dataNormal = data.map(f => f / maxValue);
    // add volume
    const dataWithVolume = dataNormal.map(f => Math.floor(f * maxAmplitude));
    console.log('writing ' + filename);
    writeWav(dataWithVolume, filename, sampleRate);
}

function getTone(freq, prime) {
    let data = createTone(sampleRate, duration, freq, 1);

    const cyclesPerSecond = 3;
    const samplesPerCycle = sampleRate / cyclesPerSecond;

    data = data.map((f, i) => {

        let cycle = Math.floor(i/samplesPerCycle) + 1;

        if (cycle <= prime) return 0;

        // non-active
        if (cycle % prime !== 0) return f;

        // determine what part of the cycle
        let percent = (i % samplesPerCycle) / samplesPerCycle;
        let amplitude = 1;
        // attack
        if (percent < 0.4) {
            percent = percent / 0.4;
            amplitude = percent*percent;
        }
        // release
        else if (percent > 0.6) {
            percent = (1-percent) / 0.4;
            amplitude = percent*percent;
        }

        return f * (1+amplitude*5);

        //let angle = percent * Math.PI; // just half
        //let amplitude = Math.sin(angle);

        //return f * (1 + amplitude * 10);
    });

    return data;
}

function getToneRandom(freq) {
    let data = createTone(sampleRate, duration, freq, 1);

    let delta = 0;
    const step = 0.01;
    const threshold = 0.3;
    const maxDelta = 0.9;
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
