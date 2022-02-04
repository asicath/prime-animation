const fs = require('fs');

class PrimeBucketRunner {

    constructor(count) {
        this.count = count;

        // create the initial state at 1, all notes active
        this.state = {n: 1, notes: []};
        for (let i = 0; i < this.count; i++) {
            this.state.notes[i] = {a: 0, active: true, isPrime: false};
        }

        // setup the buckets
        this.buckets = [];
        for (let i = 0; i < this.count; i++) {
            this.buckets[i] = {primes: [], coverage: 0};
        }

        // holds primes that have not yet made it to the buckets
        this.primeQueue = [];

        this.n = 1;
    }

    export(max) {
        const filename = `./${this.count < 10 ? '0' : ''}${this.count}.txt`;
        const output = fs.createWriteStream(filename);

        const notes = new Array(this.count).fill(0);

        // represents 1
        output.write(notes.join('').replace(/0/g, '1') + '\n');

        // represents 2
        console.log("2 | " + notes.join(''));
        output.write(notes.join('') + '\n');

        while (this.n < max) {

            this.step();

            // output
            const line = this.getOutputString();
            console.log(`${this.n} | ${line}`);
            output.write( `${line}\n`);
        }

        output.close();
    }

    getOutputString() {
        // output the current state
        let active = [];
        // then see if any of the notes are active
        for (let i = 0; i < this.buckets.length; i++) {

            // if its not active, move to the next
            if (!this.state.notes[i].active) {
                active.push(0);
                continue;
            }

            // its active
            active.push(1);
        }

        return active.join('');
    }

    step() {

        this.n += 1;

        // if this was the first step
        if (this.n === 2) {
            this.state = {n: 2, notes: [], isPrime: true};
            for (let i = 0; i < this.count; i++) {
                this.state.notes[i] = {a: 0, active: false};
            }
            this.primeQueue.push(2);
            // no need to modify the buckets
            return;
        }

        // determine if we need to move a prime from the queue to the buckets
        if (this.primeQueue[0] * 2 === this.n) {
            // move the oldest prime into the buckets
            let p = this.primeQueue.shift();

            // put in the last bucket
            addPrimeToBucket(this.buckets[this.buckets.length - 1], p);

            // now rebalance
            rebalanceBuckets(this.buckets);
        }

        // determine which notes are active
        let nextState = {n: this.n, notes: []};

        // look through each bucket
        let isPrime = true;
        for (let i = 0; i < this.buckets.length; i++) {

            // setup for silence
            nextState.notes[i] = {active: false, a: 0};

            // look at each prime in the bucket to see if it applies
            for (let j = 0; j < this.buckets[i].primes.length; j++) {
                let prime = this.buckets[i].primes[j];
                if (this.n % prime === 0 && this.n !== prime) {

                    nextState.notes[i].active = true;
                    isPrime = false;

                    // don't look at any other primes in this bucket
                    break;
                }
            }
        }

        // add to the last bucket if we found a prime
        if (isPrime) {
            this.primeQueue.push(this.n);
        }

        nextState.isPrime = isPrime;

        // setup for the next step
        this.state = nextState;
    }

    getCurrentState() {
        const o = {n: this.n};

        o.primeQueue = this.primeQueue.slice();
        o.buckets = [];
        for (let i = 0; i < this.buckets.length; i++) {
            const b = this.buckets[i];
            o.buckets[i] = {
                primes: b.primes.slice(),
                coverage: b.coverage
            }
        }

        return Object.assign(o, this.state);
    }

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

if (module.parent === null) {
    (new PrimeBucketRunner(7)).export(1000000);
}


//run(3);
//run(7);
//run(12);
//run(22);

module.exports = {PrimeBucketRunner};