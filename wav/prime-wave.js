const {output, addToCombined} = require('./arcanorum');
const {writeWav, createSilence, generateAllNotes, getAllNotes, createTone, addBytesToSizeValue} = require('./wav');

(async () => {

    const filename = `./output/full.wav`;

    // timing
    const duration = 1000*20*1;
    const sampleRate = 48000;
    const totalFrames = (duration / 1000) * sampleRate;

    // output
    const maxAmp = (32767-1000);
    const amp = maxAmp * (1/20)

    // sounds
    const fundamental = 100;
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79].slice(0, 3);

    const countPerSecond = 10; // more means the tempo is fast

    const data = [];
    for (let sampleIndex = 0; sampleIndex < totalFrames; sampleIndex++) {

        // determine the time based on which sample index we are rendering
        let time = (sampleIndex / sampleRate); // in seconds

        // determine the place on the number line that this time represents
        let x = (time * countPerSecond) + 1;

        // create the sample
        let sample = 0;
        primes.forEach((n, m) => {
            // sampleRate = 44100 times per second
            // freq = 440 times per second
            let freq = fundamental * (m+1);

            // based on time
            const timePerWave = 1 / freq;
            const wavePercent = (time / timePerWave) % 1;
            const angle = wavePercent * Math.PI * 2;
            const y = Math.sin(angle);

            // based on number
            let ampPercent = (x % n) / n;
            if (ampPercent >= 0.5) {
                ampPercent = (ampPercent - 0.5) / 0.5;
            }
            else {
                ampPercent = 1 - (ampPercent / 0.5);
            }

            sample += y * ampPercent;
        });

        // add sample to the pile
        const value = sample * amp;
        data.push(value);
    }

    writeWav(data, filename, sampleRate);
})();

