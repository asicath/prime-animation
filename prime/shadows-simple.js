
const pattern = createPattern();

function createPattern() {
    return [4,2];
}

function isPrime(n) {
    const max = Math.floor(Math.sqrt(n));

    if (n % 2 === 0 || n % 3 === 0) {
        if (n === 2 || n === 3) return true;
        return false;
    }

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
        //console.log(n);
    }
}

const duration = Date.now() - start;
const each = duration / findPrimesUnder;
const rate = Math.floor(findPrimesUnder / duration);

console.log(`${count} primes found in ${duration}ms ${rate}primes/ms`);

// 664579 primes found in 1668ms 5995primes/ms
// 664579 primes found in 1663ms 6013primes/ms

// 5761455 primes found in 43,588ms 2294primes/ms
