
function isPrime(n) {
    const max = Math.floor(Math.sqrt(n));
    for (let i = 2; i <= max; i++) {
        if (n % i === 0) return false;
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

// 664579 primes found in 4536ms 2204primes/ms
// 664579 primes found in 4542ms 2201primes/ms

// 5761455 primes found in 120106ms 832primes/ms