const {writeWav, createSilence, generateAllNotes} = require('./wav');

const sampleRate = 48000; // 96000;

generateSoundData();

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
    const freqs = generateAllNotes();

    // let noteCount = 12;
    // let startNote = 16-7;
    // let notes = [];
    // for (let i = startNote; i < startNote + noteCount; i++) {
    //     notes.push({ freq: freqs[i]}); // 1
    // }

    let noteCount = 12;//7;
    let startNote = 16;//-2-7;
    let notes = [];
    for (let i = startNote; i < startNote + noteCount; i++) {
        notes.push({ freq: freqs[i]}); // 1
    }

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
        attackVolume: 0.9,
        sustainVolume: 0.6
    };

    let data = [];
    for (let n = 3; n < 10000000; n++) {

        // determine if we need to move a prime from the queue to the buckets
        if (primeQueue[0] * 2 === n) {
            // move the oldest prime into the buckets
            let p = primeQueue.shift();

            // put in the last bucket
            addPrimeToBucket(buckets[buckets.length - 1], p);

            // now rebalance
            rebalanceBuckets(buckets);
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
        let intervalData = createSilence({sampleRate, duration});

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

        // lets output
        if (n % 1000 === 0) {

            console.log('------');
            console.log(n);
            console.log(`in queue ${primeQueue.length}`);
            buckets.forEach((bucket, i) => {
                console.log(`${i} ${bucket.primes.length} ${bucket.coverage}`);
            });

            //if (n > 1000000) {
                let s = n.toString();
                while (s.length < 10) {
                    s = "0" + s;
                }

                let max = 32767;
                max = max / 10;
                const output = data.map(v => {return v * max;});


                writeWav(output, `new12-${s}12.wav`, sampleRate);
                console.log('output:');
            //}


            // reset
            data = [];
        }
    }
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

    //duration = duration + Math.floor(Math.random()*0.05*duration);

    let f1 = getSoundDataByStateAndFreq({sampleRate, duration, admr, freq:note.freq, prevState, state, nextState});
    let f2 = getSoundDataByStateAndFreq({sampleRate, duration, admr, freq:note.freq*2, prevState, state, nextState});
    let f3 = getSoundDataByStateAndFreq({sampleRate, duration, admr, freq:note.freq*3, prevState, state, nextState});
    let f4 = getSoundDataByStateAndFreq({sampleRate, duration, admr, freq:note.freq*4, prevState, state, nextState});
    let f5 = getSoundDataByStateAndFreq({sampleRate, duration, admr, freq:note.freq*5, prevState, state, nextState});
    let f6 = getSoundDataByStateAndFreq({sampleRate, duration, admr, freq:note.freq*6, prevState, state, nextState});
    let f7 = getSoundDataByStateAndFreq({sampleRate, duration, admr, freq:note.freq*7, prevState, state, nextState});

    let data = [];
    for (let i = 0; i < f1.length; i++) {

        data[i] = f1[i]*1.00 + f2[i]*0.77 + f3[i]*0.18 + f4[i]*0.11 + f5[i]*0.05 + f6[i]*0.02;
        //data[i] = f1[i]*1.00;
    }
    return data;
}

function getSoundDataByStateAndFreq({sampleRate, duration, admr, freq, prevState, state, nextState}) {
    const data = [];

    // total number of samples that compose the duration
    let samples = sampleRate * (duration / 1000);

    // number of samples per wave length
    let waveLength = Math.floor(sampleRate / freq);

    let volumeAdjust = 0;
    let volumeMovingUp = false;
    let volumeChangeChance = 0.2;

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

        // random
        if (Math.random() < volumeChangeChance) volumeMovingUp = !volumeMovingUp;
        volumeAdjust = volumeMovingUp ? volumeAdjust + 0.005 : volumeAdjust - 0.005;

        let adjustedVolume = Math.max(volume + volumeAdjust * volume, 0);

        // find the height of the wave
        let v = Math.sin(a) * adjustedVolume;

        // add to the data
        data.push(v);
    }

    // record the last position
    state.a = a;

    return data;
}
