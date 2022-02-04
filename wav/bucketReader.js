const fs = require('fs');
const readline = require('readline');

class BucketReader {

    constructor(filepath) {

        this.rl = readline.createInterface({
            input: fs.createReadStream(filepath),
            crlfDelay: Infinity
        });

        this.buffer = [];
        this.waitingPromise = null;
        this.rl.on('line', (line) => {
            this.buffer.push(line);
            this.rl.pause();

            if (this.waitingPromise !== null) {
                let p = this.waitingPromise;
                this.waitingPromise = null;

                let value = this.buffer.shift();
                p.resolve(value);
            }
        });

    }

    async getNextLine() {
        if (this.buffer.length > 0) {
            let value = this.buffer.shift();
            return value;
        }

        this.rl.resume();

        return new Promise((resolve, reject) => {
            //console.log('b');
            this.waitingPromise = {resolve};
        });
    }

}

exports.BucketReader = BucketReader;


if (module.parent === null) {
    (async () => {
        const reader = new BucketReader('./03.txt');
        for (let i = 1; i < 100; i++) {
            console.log(i.toString() + " " + await reader.getNextLine());
        }
    })();
}
