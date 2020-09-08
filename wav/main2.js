const fs = require('fs');
const path = require('path');
const C = require('construct-js');

const sampleRate = 48000; // 96000;

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

    fs.writeFileSync(path.join(__dirname, '/new12-0.wav'), fileStruct.toBuffer());
}

function combine(a, b) {
    const ab = [];
    for (let i = 0; i < a.length; i++) {
        ab[i] = a[i] + b[i]
    }
    return ab;
}

function addPrimeToBucket(bucket, prime) {
    bucket.primes.push(prime);

    if (bucket.coverage === 0) {
        bucket.coverage = 1 / prime;
    }
    else {
        // the original coverage, plus a portion of the non-covered
        bucket.coverage = bucket.coverage + (1 - bucket.coverage) / prime;
        // 2 = 3/6
        // 3 = 2/6
        // 2+3 = 3/6 + (3/6) / 3 = 4/6 = 2/3
    }
}

function removeSmallestPrime(bucket) {
    let prime = bucket.primes.shift();

    if (bucket.primes.length === 0) {
        bucket.coverage = 0;
    }
    else {
        // the uncovered portion gains a proportionate amount back.
        bucket.coverage = bucket.coverage - (1 - bucket.coverage) / (prime-1);

        // 2+3 = 4/6
        // remove 2 = 4/6 - ((2/6) / (2-1)) = 2/6 = 1/3

        //3&5 = 5/15 + 10/15 / 5 = 5/15 + 2/15 = 7/15
        // remove 3 = 7/15 - (8/15) / (3-1) = 7/15 - 4/15 = 3/15 = 1/5
    }
    return prime;
}

function rebalanceBuckets(buckets) {

    let balanced = false;

    while (!balanced) {
        balanced = true;
        for (let i = buckets.length - 1; i > 0; i--) {
            let a = buckets[i]; // should be smaller coverage
            let b = buckets[i-1];

            if (a.coverage > b.coverage) {
                // need to move a prime
                let prime = removeSmallestPrime(a);
                addPrimeToBucket(b, prime);

                // restart
                balanced = false;
                break;
            }
        }
    }
}

function generateSoundData() {

    // first generate the notes to be used
    let ratio = 2**(1/12);
    let notes = [];
    let freq = 220; // A
    freq *= ratio; // A#
    freq *= ratio; // B
    freq *= ratio; // C
    notes.push({ freq: freq}); // 1
    freq *= ratio; // C#
    freq *= ratio; // D
    notes.push({ freq: freq}); // 2
    freq *= ratio; // D#
    freq *= ratio; // E
    notes.push({ freq: freq}); // 3
    freq *= ratio; // F
    notes.push({ freq: freq}); // 4
    freq *= ratio; // F#
    freq *= ratio; // G
    notes.push({ freq: freq}); // 5
    freq *= ratio; // G#

    freq *= ratio; // A
    notes.push({ freq: freq}); // 6
    freq *= ratio; // A#
    freq *= ratio; // B
    notes.push({ freq: freq}); // 7
    freq *= ratio; // C
    notes.push({ freq: freq}); // 8
    freq *= ratio; // C#
    freq *= ratio; // D
    notes.push({ freq: freq}); // 9
    freq *= ratio; // D#
    freq *= ratio; // E
    notes.push({ freq: freq}); // 10
    freq *= ratio; // F
    notes.push({ freq: freq}); // 11
    freq *= ratio; // F#
    freq *= ratio; // G
    notes.push({ freq: freq}); // 12
    freq *= ratio; // G#


    // create the prev state, set all the notes to silence
    // also, setup the current state
    let prevState = {n:1, notes:[]};
    let state = {n:2, notes:[]};
    const buckets = [];
    for (let i = 0; i < notes.length; i++) {
        prevState.notes[i] = {a: 0, active: false};
        state.notes[i] = {a: 0, active: false};

        buckets[i] = {primes:[], coverage: 0};
    }

    const primeQueue = [2];

    // now sound info
    const duration = 300;
    const admr = {
        attack: 0.05,
        decay: 0.1,
        release: 0.1,
        attackVolume: 1,
        sustainVolume: 0.6
    };

    const data = [];
    for (let n = 3; n < 2000; n++) {

        // determine if we need to move a prime from the queue to the buckets
        if (primeQueue[0] * 2 === n) {
            // move the oldest prime into the buckets
            let p = primeQueue.shift();

            // put in the last bucket
            addPrimeToBucket(buckets[buckets.length - 1], p);

            // now rebalance
            rebalanceBuckets(buckets);

            console.log('------');
            console.log(`in queue ${primeQueue.length}`);
            buckets.forEach((bucket, i) => {
                console.log(`${i} ${bucket.primes.length} ${bucket.coverage}`);
            });
        }

        // determine which notes are active
        let nextState = {n, notes:[]};

        // look through each bucket
        let isPrime = true;
        for (let i = 0; i < buckets.length; i++) {

            // setup for silence
            nextState.notes[i] = {active: false, a: 0};

            // look at each prime in the bucket to see if it applies
            for (let j = 0; j < buckets[i].primes.length; j++) {
                let prime = buckets[i].primes[j];
                if (n % prime === 0 && n !== prime) {

                    nextState.notes[i].active = true;
                    isPrime = false;

                    // don't look at any other primes in this bucket
                    break;
                }
            }
        }

        // add to the last bucket if we found a prime
        if (isPrime) {
            primeQueue.push(n);
        }

        // render the audio

        // start with silence
        let intervalData = getSilence({sampleRate, duration});

        // then see if any of the notes are active
        for (let i = 0; i < buckets.length; i++) {

            // if its not active, move to the next
            if (!state.notes[i].active) continue;

            // get the individual note data
            let noteData = getSoundDataByState({
                sampleRate,
                duration,
                admr,
                note: notes[i],
                prevState: prevState.notes[i],
                state: state.notes[i],
                nextState: nextState.notes[i]
            });

            // add it to the combined
            for (let j = 0; j < intervalData.length; j++) {
                intervalData[j] += noteData[j];
            }
        }

        // setup for the next step
        prevState = state;
        state = nextState;

        // add intervalData to data
        data.push(...intervalData);
    }

    // apply max volume
    let max = 32767;
    max = max / 4;
    const output = data.map(v => {return v * max;});

    return output;
}

function getSilence({sampleRate, duration}) {
    const data = [];
    let samples = sampleRate * (duration / 1000);
    for (let i = 0; i < samples; i++) {
        data[i] = 0;
    }
    return data;
}

/*

* -> a -> ab
a gets attack/decay, no release

a -> ab -> b
b gets an attack/decay, no release
a gets a release

ab -> b -> *
b gets release

state: {
    notes: {
        a: true,
        b: true,
        c: false
    }
}

 */

function getSoundDataByState({sampleRate, duration, admr, note, prevState, state, nextState}) {
    const data = [];

    // total number of samples that compose the duration
    let samples = sampleRate * (duration / 1000);

    // number of samples per wave length
    let waveLength = Math.floor(sampleRate / note.freq);

    // generate each sample
    let a = 0;
    for (let i = 0; i < samples; i++) {

        // determine the volume based on admr
        let volume = admr.sustainVolume; // the base volume, assume a sustain

        // determine the percent
        let percent = i / samples;

        // attack
        if (percent < admr.attack) {
            if (!prevState.active) { // only if the previous state was not playing
                let attackPercent = percent / admr.attack; // the percent 0-1 we are into the attack
                volume = attackPercent * admr.attackVolume;
            }
        }

        // decay
        else if (percent < admr.attack + admr.decay) {
            if (!prevState.active) { // only if the previous state was not playing
                let decayPercent = (percent - admr.attack) / admr.decay; // the percent 0-1 we are into the decay
                let decayAmount = admr.attackVolume - admr.sustainVolume; // the total amount that attack will decay into sustain
                volume = admr.attackVolume - decayPercent * decayAmount;
            }
        }

        // release
        else if (percent >= 1 - admr.release) {
            if (!nextState.active) { // only if not active in the next state (move to silence)
                let releasePercent = (percent - (1 - admr.release)) / admr.release;
                volume = (1-releasePercent) * admr.sustainVolume;
            }
        }




        // determine the angle
        a = ((i % waveLength) / waveLength) * Math.PI * 2;

        // offset from the prev state
        a += prevState.a;

        // find the height of the wave
        let v = Math.sin(a) * volume;

        // add to the data
        data.push(v);
    }

    // record the last position
    state.a = a;

    return data;
}
