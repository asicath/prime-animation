
const range = (function() {

    const primes = [];

    Prime.on('prime', addPrime);
    Prime.init();

    function addPrime(n) {

        // create the base prime
        let prime = {n: n};

        // get the existing coverage gap
        let uncovered = primes.length === 0 ? 1 : 1 - primes[primes.length - 1].sumCoverage;

        // take a smaller portion each time
        prime.addCoverage = uncovered * (1 / n);

        // get the sum
        prime.sumCoverage = (1 - uncovered) + prime.addCoverage;

        // add it to the list
        primes.push(prime);
    }

    function getRangeAt(n, intervalCount) {

        // make sure we've got enough primes
        //let target = Math.floor(Math.sqrt(n));
        let target = Math.floor(n/2);
        Prime.createPrimesTo(n);

        // find the max prime for this number
        let iMax = primes.length - 1;
        while (iMax > 0 && primes[iMax].n > target) { // ?? Could make this sqrt n
            iMax -= 1;
        }

        // get max coverage
        //let coverage = primes[iMax].sumCoverage;

        let ranges = [];
        let range = null;
        let i = 0;

        // create the initial ranges, up to the max count
        while (i <= iMax && ranges.length < intervalCount) {
            range = getSingularRange(i);
            ranges.push(range);
            i++;
        }

        let j = ranges.length - 1;

        while (i <= iMax) {
            range = ranges[j];

            // get the next default range
            ranges[j] = getNextRange(range);

            while (!checkForBalance(j, ranges)) {

            }

            i++;
        }

        return ranges;
    }

    function checkForBalance(j, ranges) {

        // at the bottom
        if (j === 0) return true;

        let next = ranges[j];
        let prev = ranges[j-1];
        if (next.active > prev.active) {
            //console.log('needs step down');

            // reduce on the front
            ranges[j] = getReducedRange(next);

            // advance the next
            ranges[j - 1] = getNextRange(prev);

            // need to check on level deeper to check if this change propogates one level further
            return false;
        }
        return checkForBalance(j - 1, ranges);
    }

    function getSingularRange(i) {
        let prime = primes[i];

        let range = {
            active: 1/prime.n,
            next: null,

            count: 1,
            sum: prime.n,

            start: prime.n,
            end: prime.n,
            startIndex: i,
            endIndex: i
        };

        // calculate the next coverage percent
        if (i+1 < primes.length) range.next = range.active + (1 - range.active) * (1 / primes[i+1].n);

        return range;
    }

    function getNextRange(range) {
        let i = range.endIndex + 1;
        let prime = primes[i];

        let next = {
            active: range.active + (1 - range.active) * (1/prime.n),
            next: null,

            count: range.count + 1,
            sum: range.sum + prime.n,

            start: range.start,
            end: prime.n,
            startIndex: range.startIndex,
            endIndex: i
        };

        // calculate the next coverage percent
        if (i+1 < primes.length) next.next = next.active + (1 - next.active) * (1 / primes[i+1].n);

        return next;
    }

    // drops one on the front end
    function getReducedRange(range) {
        let i = range.startIndex;
        let prime = primes[i];
        let nextPrime = primes[i + 1];

        let next = {
            active: range.active - (1 / (range.sum - prime.n)) * (1 / prime.n),
            next: null,

            count: range.count - 1,
            sum: range.sum - prime.n,

            start: nextPrime.n,
            end: range.end,
            startIndex: range.startIndex + 1,
            endIndex: range.endIndex
        };

        // calculate the next coverage percent
        if (i+1 < primes.length) next.next = next.active + (1 - next.active) * (1 / primes[i+1].n);


        return next;
    }

    return {
        getRangeAt
    }
})();

//console.log(range.getRangeAt(2, 7));
//console.log(range.getRangeAt(3, 7));

// sub: p - 1/(sum-n) * (1/n)
