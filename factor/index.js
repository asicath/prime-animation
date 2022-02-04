
const primes = [];
let nMax = 1;

function isPrime(n) {
    const max = Math.floor(Math.sqrt(n));
    for (let i = 2; i <= max; i++) {
        if (n % i === 0) return false;
    }
    return true;
}

function findPrimesUpTo(n) {
    for (let m = nMax + 1; m < n; m++) {

        // check if the number is prime
        if (isPrime(m)) {
            // add it to the collection
            primes.push(m);
        }

        // store the fact that we have checked up to this number
        nMax = m;
    }
}

function findPrimeFactors(n) {

    let value = n;
    const factors = [];
    while (value !== 1) {
        const max = Math.ceil(Math.sqrt(value));
        let found = false;
        for (let i = 0; primes[i] <= max; i++) {
            const prime = primes[i];
            if (value % prime === 0) {
                factors.push(prime);
                value = value / prime;
                found = true;
                break;
            }
        }
        if (!found) {
            factors.push(value);
            value = 1;
        }
    }
    return factors;
}




if (module.parent === null) {
    const start = Date.now();
    const findPrimesUnder = 100000;
    findPrimesUpTo(findPrimesUnder);
    const duration = Date.now() - start;
    const each = duration / findPrimesUnder;
    const rate = Math.floor(findPrimesUnder / duration);

    console.log(`${primes.length} primes found in ${duration}ms ${rate}primes/ms`);

    let n = 2;
    for (let i = 0; i < 100; i++) {
        let f0 = findPrimeFactors(n++);
        console.log((n - 1).toString() + ": " + JSON.stringify(f0));
    }

}


// 1. Find primes
// 2. Determine the min prime factors of a number
//    Can be done by finding all the small prime factors, those < sqrt(n).
//    When one is found, restart the search using the remainder
//    The large prime factors are just the
// 3. Determine the prime groups for each number