const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const {Kaph} = require('./draw');
const {Prime} = require('./prime');

const FPS60 = 60;
const FPS30 = 30;

(async () => {

    let skipMinutes = 60;
    //skipMinutes = 0;

    // await execute({
    //     path: `C:/git/spiral/frames/0003`,
    //     //width: 3840*2, height: 2160*2,
    //     width: 1080*8, height: 1080*8,
    //     fps: 0.01,
    //     startTime: 1000*60 * skipMinutes,
    //     runTimeSeconds: 60*60*100 // 2 min
    // });

    await execute({
        path: `C:/git/spiral/frames/0000`,
        width: 3840,
        height: 2160,
        fps: FPS60,
        startTime: 1000*6,
        runTimeSeconds: 60*5 // 1 min
    });

})();

async function sleep(time) {
    await new Promise((resolve, reject) => { setTimeout(resolve, time); });
}

async function execute({path, width, height, startTime, runTimeSeconds, fps}) {

    // set initial time
    Prime.AddTime(startTime);

    let frame = 0;
    let totalFrames = fps * runTimeSeconds;

    let start = Date.now();

    while (frame < totalFrames) {

        // needs a new canvas everytime...
        const canvas = createCanvas(width, height);

        // output a time
        if (frame % 100 === 0 && frame > 0) {
            const now = Date.now();
            const elapsed = Date.now() - start;
            console.log(`${elapsed / 100}ms per frame`);
            start = now;
        }

        // draw the image
        await drawFrame(canvas);

        // save the image, dont await
        await exportCanvas(canvas, frame, path);

        // move time forward
        Prime.AddTime(1000 / fps);

        frame += 1;

        // only one frame
        //frame = totalFrames;
    }

}

async function exportCanvas(canvas, frameNumber, path) {
    // export
    let name = frameNumber.toString();
    while (name.length < 10) {
        name = "0" + name;
    }
    await exportCanvasToImage(canvas, `${path}/${name}.png`);
}

async function drawFrame(canvas) {
    drawBackground(canvas, '000000');
    Kaph.Init(canvas);
    Kaph.Draw(0,0);
}

function drawBackground(canvas, color) {
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = "#" + color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function exportCanvasToImage(canvas, filename) {
    return new Promise((resolve, reject) => {
        const out = fs.createWriteStream(filename);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => {
            //console.log(`${filename} was created.`);
            resolve();
        });
    });
}


