
const Prime = (() => {

    const primes = [];

    let upToA = 0;
    let upToB = 0;

    function init() {
        // initialize the primes
        onPrime(2);
        onPrime(3);
        onPrime(5);
        upToA = 1;
        upToB = 5;
    }

    function createPrimesTo(n) {
        while (upToA < n && upToB < n) {
            upToA += 6;
            if (isPrime(upToA)) onPrime(upToA);
            upToB += 6;
            if (isPrime(upToB)) onPrime(upToB);
        }
    }

    function isPrime(n) {

        let max = Math.floor(Math.sqrt(n));

        for (let j = 0; j < primes.length; j++) {
            let prime = primes[j];

            // don't find above the limit
            if (prime.n > max) return true;

            // found a factor
            if (n % prime.n === 0) return false;
        }

        return true;
    }

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    function getPrimeFactors(n) {

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

        const unique = factors.filter( onlyUnique ).sort();

        return unique;
    }

    function onPrime(n) {
        primes.push(n);
        emit('prime', n);
    }

    const events = {};
    function on(eventName, fn) { events[eventName] = fn; }
    function emit(eventName, data) {
        if (events.hasOwnProperty(eventName)) {
            events[eventName](data);
        }
    }

    return {
        on,
        init,
        isPrime,
        createPrimesTo,
        getPrimeFactors
    }
})();

if (typeof module !== 'undefined') {
    module.exports = Prime;

    if (module.parent === null) {

        Prime.on('prime', (n) => {
            //console.log('found prime: ' + n);
        });

        Prime.init();

        Prime.createPrimesTo(1000);

        for (let i = 0; i < 100; i++) {
            const n = 2 + i;
            let f0 = Prime.getPrimeFactors(n);
            console.log((n).toString() + ": " + JSON.stringify(f0));
        }

    }
}