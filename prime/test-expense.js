
const times = 10000000000;
const arLength = 100000000;
const loops = times/arLength;
const ar = [];

(() => {
    const start = Date.now();
    for (let i = 0; i < arLength; i++) {
        ar.push(Math.random());
    }
    const duration = Date.now() - start;
    console.log(duration);
    console.log(arLength / duration);
})();



(() => {
    const start = Date.now();
    for (let j = 0; j < loops; j++) {
        for (let i = 0; i < ar.length - (1+j); i++) {
            let v = ar[i] < ar[i + 1+j];
        }
    }
    const duration = Date.now() - start;

    console.log(duration);
    console.log(times / duration);

})();


(() => {
    const start = Date.now();
    for (let j = 0; j < loops; j++) {
        for (let i = 0; i < ar.length - (1+j); i++) {
            let v = ar[i] % ar[i+1+j];
        }
    }
    const duration = Date.now() - start;
    console.log(duration);
    console.log(times / duration);
})();