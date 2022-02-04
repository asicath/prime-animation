const {BucketReader} = require('./bucketReader');
const {writeWav, createSilence, generateAllNotes, getAllNotes, createTone} = require('./wav');

const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199];

const sampleRate = 48000; // 96000;

const notes = getAllNotes();
const duration = 1000*20*1;

const maxAmp = 32767-3000;

//makeWavs1();

if (module.parent === null) {
    (async () => {

        let buckets = await loadPrimeBuckets();
        // ABCDEFG
        // CEGBDFA

        // CEG
        const chord = ['C1','E1','G1'];

        // EGB
        //const chord = ['E1','G1','B1'];

        // GBD
        //const chord = ['G1','B1','D1'];

        // BDF
        //const chord = ['B1','D1','F1'];

        // DFA
        //const chord = ['D1','F1','A1'];

        // FAC (sounded nice)
        //const chord = ['F1','A1','C1'];

        // ACE
        //const chord = ['A1','C1','E1'];


        //const chord = ['A1','C2','E2'];
        makeWavs2(chord, buckets);

        //makeWavs22("C1", buckets);
    })();
}



async function loadPrimeBuckets() {

    let buckets = {};
    let orders = ["03", "07", "12", "22"];

    for (let i = 0; i < orders.length; i++) {
        let order = orders[i];
        buckets[order] = await loadBucket(order);
    }

    return buckets;
}

async function loadBucket(order) {
    const reader = new BucketReader(`./${order}.txt`);

    let o = [null];

    for (let n = 1; n < 1000000; n++) {
        let a = [];
        let line = await reader.getNextLine();
        for (let i = 0; i < line.length; i++) {
            a.push(line[i] === "0" ? false : true);
        }
        o.push(a);
    }

    return o;
}

function addToCombined(combined, data) {
    if (combined === null) {
        //combined = data;
        return data.map((f, i) => f);
    }
    else {
        return combined.map((f, i) => f + data[i]);
    }
}

function createNote(primary, count, bucket, reverse) {
    let combined = null;
    for (let n = 1; n <= count; n++) {
        // create tone
        const freq = primary * n;
        let data = createTone(sampleRate, duration, freq, 1);

        data = applyPrimeAmpMod(data, bucket, n-1, 1, 1, .6, false);
        //data = applyFog({input:data, maxDelta: 0.9, threshold: 0.3, step: 0.01});
        data = applyFog({input:data, maxDelta: 0.2, threshold: 0.2, step: 0.01});

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

async function makeWavs2(chord, buckets) {

    const freq12 = notes[chord[0]].freq;
    const freq7 = notes[chord[1]].freq;
    const freq3 = notes[chord[2]].freq;

    const c3 = createNote(freq3, 3, buckets["03"], false);
    const c7 = createNote(freq7, 7, buckets["07"], false);
    const c12 = createNote(freq12, 12, buckets["12"], false);

    output(c3,`arcanorum-output/${chord.join('-')}_03.wav`, maxAmp)
    output(c7,`arcanorum-output/${chord.join('-')}_07.wav`, maxAmp)
    output(c12,`arcanorum-output/${chord.join('-')}_12.wav`, maxAmp)

    const combined = c12.map((f, i) => {
        return f + c3[i] + c7[i];
    });

    // now output the combined
    output(combined,`arcanorum-output/${chord.join('-')}_combined.wav`, maxAmp)
}

async function makeWavs22(noteName, buckets) {
    const freq = notes[noteName].freq;
    const data = createNote(freq, 22, buckets["22"], false);
    output(data,`arcanorum-output/${noteName}_22.wav`, maxAmp)
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

function easeInOutSine(x) {
    return -(Math.cos(Math.PI * x) - 1) / 2;
}

function applyPrimeAmpMod(data, bucket, index, activeFactor, cyclesPerSecond, baseMod = 1, reverse = false) {
    //const cyclesPerSecond = 3;
    const samplesPerCycle = sampleRate / cyclesPerSecond;

    const attack = 0.4;
    const release = 0.4;
    //const activeFactor = 1;

    data = data.map((f, i) => {

        let n = Math.floor(i/samplesPerCycle) + 2 + 500000;

        // determine if active this cycle
        let isActiveThisCycle = bucket[n][index];
        // determine attack/release
        let isActivePrevCycle = bucket[n-1][index];
        let isActiveNextCycle = bucket[n+1][index];

        if (reverse) {
            isActiveThisCycle = !isActiveThisCycle;
            isActivePrevCycle = !isActivePrevCycle;
            isActiveNextCycle = !isActiveNextCycle;
        }


        // mod not active for this note
        if (!isActiveThisCycle) {
            // not active, just return the value
            return f*baseMod;
        }



        // determine what part of the cycle
        let percent = (i % samplesPerCycle) / samplesPerCycle;

        // default to sustain
        let amplitude = 1;

        // attack
        if (percent < attack) {
            if (isActivePrevCycle) {
                amplitude = 1;
            }
            else {
                amplitude = easeInOutSine(percent / attack);
            }
        }

        // release
        else if (percent > (1-release)) {
            if (isActiveNextCycle) {
                amplitude = 1;
            }
            else {
                amplitude = (1-percent) / release;
                amplitude = 1- easeInOutSine(1-amplitude);
            }
        }

        // apply the amplitude plue factor
        let mod = amplitude * activeFactor;
        return f*baseMod + f * mod;
    });

    return data;
}

function applyFog({input, maxDelta = 0.9, threshold = 0.3, step = 0.01}) {
    //let data = createTone(sampleRate, duration, freq, 1);

    let delta = 0;

    const output = input.map(f => {

        let r = Math.random();

        // move down
        if (r < threshold && delta > -maxDelta) delta -= step;

        // move up
        else if (r > 1-threshold && delta < maxDelta) delta += step;

        return f * (1+delta);
    });

    return output;
}

module.exports = {output, addToCombined};