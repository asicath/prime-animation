const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const {Kaph} = require('./draw2');

(async () => {

    let rootPath = `${__dirname}/frames`;

    await execute({
        path: `${rootPath}/demo3`,
        //width: 1920, height: 1080,
        width: 1920*4, height: 1080*4,
    });

})();

async function sleep(time) {
    await new Promise((resolve, reject) => { setTimeout(resolve, time); });
}

async function execute({path, width, height}) {

    for (let frame = 0; frame < 1; frame++) {
        // needs a new canvas everytime...
        const canvas = createCanvas(width, height);

        // draw the image
        //const n = 300000 + frame * (1/10) + 0.333;
        //const n = 3 + frame * 1000;
        const n = 3001 + frame * (1/10);

        if (n === Math.floor(n)) {console.log(n);}
        await drawFrame(canvas, n);

        // save the image, dont await
        await exportCanvas(canvas, frame, path);
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

async function drawFrame(canvas, n) {
    drawBackground(canvas, '000000');
    Kaph.Init(canvas);
    Kaph.Draw(n);
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

        // const out = fs.createWriteStream(filename.replace('.png', '.jpg'));
        // const stream  = canvas.createJPEGStream({
        //     quality: 1,
        //     chromaSubsampling: false, progressive: false
        // });


        stream.pipe(out);
        out.on('finish', () => {
            //console.log(`${filename} was created.`);
            resolve();
        });
    });
}


