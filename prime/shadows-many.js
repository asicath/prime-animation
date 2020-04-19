
const knownPrimes = [2,3,5,7,11,13,17,19];
const pattern = createPattern(knownPrimes);

function createPattern(primes) {

    // calculate the pattern size:
    let size = primes.reduce((value, p) => {return value * p;}, 1);

    // create pattern sized array
    let a = new Array(size).fill(true);

    // create the pattern - find the shadows
    primes.forEach(p => {
        for (let n = p; n <= a.length; n += p) {
            a[n-1] = false;
        }
    });

    // calculate the distance between shadows and reduce
    let pattern = [];
    let n = 0;
    while (n < a.length) {
        // find the distance from the current position to the next position that = true
        let m = n+1;
        let count = 1;
        while (!a[m]) {
            count++;
            // advance the m
            m++;
            if (m === a.length) m = 0;
        }
        pattern.push(count);
        n += count;
    }

    console.log(`pattern length:${pattern.length} reduced from ${a.length} reduction to ${pattern.length/a.length}`);

    return pattern;
}

function isPrime(n) {
    const max = Math.floor(Math.sqrt(n));

    for (let i = 0; i < knownPrimes.length; i++) {
        if (n % knownPrimes[i] === 0) {
            return (n === knownPrimes[i]);
        }
    }


    // if (n % 2 === 0 || n % 3 === 0 || n % 5 === 0) {
    //     if (n === 2 || n === 3 || n === 5) return true;
    //     return false;
    // }

    let i = 0;
    let m = 1 + pattern[i];
    while (m <= max) {

        // make the check
        if (n % m === 0) return false;

        // move to the next
        i++;
        if (i === pattern.length) i = 0;

        // advance, all primes must fall in the shadows of 2 & 3
        m += pattern[i];
    }

    return true;
}

const start = Date.now();
const findPrimesUnder = 100000000;

let count = 0;
for (let n = 2; n < findPrimesUnder; n++) {
    if (isPrime(n)) {
        count++;
    }
}

const duration = Date.now() - start;
const each = duration / findPrimesUnder;
const rate = Math.floor(findPrimesUnder / duration);

console.log(`${count} primes found in ${duration}ms ${rate}primes/ms`);

// 664579 primes found in 1091ms 9165primes/ms - 17
// 664579 primes found in 1035ms 9661primes/ms - 19
// 664579 primes found in 1041ms 9606primes/ms - 19

// 5761455 primes found in 25926ms 3857primes/ms
// 5761455 primes found in 25895ms 3861primes/ms