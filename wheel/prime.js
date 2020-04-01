
const Prime = function () {

    let numbersPerSecond = 0.1;
    let number = 0.0;
    let lastWholeNumber = 0;
    let primes = [];
    let acceleration = 0.001;
    let leftOverSeconds = 0;
    let totalTime = 0;

    let framesPerSecond = 60;
    let msPerFrame = 1000 / framesPerSecond;

    let Init = function () {
        // Events
        //Timer.AddEvent(AddTime);
    };

    function GetCurrentNumber() {
        return number;
    }

    let AddTime = function (time) {

        totalTime += time;

        while (time > 0) {

            // determine if we have enough time for a complete frame
            if (time < msPerFrame) {
                // store left over time until next time
                leftOverSeconds = time;
                time = 0;
            }
            else {

                // advance the number one frame amount
                number += (numbersPerSecond/1000) * msPerFrame;

                // reduce the amount that we have left to process
                time -= msPerFrame;

                // advance the acceleration
                numbersPerSecond += acceleration;
            }

        }

        AddPrimes();
    };

    let GetTime = function() {
        return totalTime;
    };

    let GetCountPerSecond = function () {
        return numbersPerSecond;
    };

    let GetLastWholeNumber = function () {
        return lastWholeNumber;
    };

    let Acceleration = function (value) {
        if (typeof value !== 'undefined') { acceleration = value; }
        return acceleration;
    };

    let AddPrimes = function () {
        let wholeNumber = parseInt(Math.floor(number));

        // Don't skip any
        while (lastWholeNumber < wholeNumber) {
            lastWholeNumber++;

            if (IsPrime(lastWholeNumber)) {
                primes.push(lastWholeNumber);
                console.log(`found prime #${primes.length} : ${lastWholeNumber}`);
            }
        }

    };

    let IsPrime = function (n) {

        // less than 1 is always prime
        if (n <= 1) { return false; }

        // don't check anything above sqrt of n
        const max = Math.floor(Math.sqrt(n));

        for (let i = 0; i < primes.length; i++) {
            if (n % primes[i] === 0) {
                return false;
            }
            if (primes[i] > max) return true;
        }
        return true;
    };

    return {
        Init,
        GetCurrentNumber,
        Current: primes,
        GetCountPerSecond,
        GetLastWholeNumber,
        GetTime,
        Acceleration,
        AddTime
    };
} ();

if (typeof exports !== "undefined") {
    exports.Prime = Prime;
}