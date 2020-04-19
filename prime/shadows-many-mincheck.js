
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

let count = knownPrimes.length;
let totalChecked = 0;
let i = 0;
let n = 1 + pattern[i];
while (n < findPrimesUnder) {
    if (isPrime(n)) {
        count++;
    }
    totalChecked++;

    // move to the next
    i++;
    if (i === pattern.length) i = 0;

    // advance, all primes must fall in the shadows of the known primes used to generate the
    n += pattern[i];
}

const duration = Date.now() - start;
const each = duration / findPrimesUnder;
const rate = Math.floor(findPrimesUnder / duration);

console.log(`${count} primes found in ${duration}ms ${rate}primes/ms --- checked ${totalChecked} / ${totalChecked/findPrimesUnder}%, prime: ${count / totalChecked}%`);

// 664579 primes found in 871ms 11481primes/ms
// 664579 primes found in 870ms 11494primes/ms
// 664579 primes found in 873ms 11454primes/ms

// 5761455 primes found in 22579ms 4428primes/ms
// 5761455 primes found in 22530ms 4438primes/ms