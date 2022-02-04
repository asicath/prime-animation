const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const {drawFrame} = require('./draw');

(async () => {
    let rootPath = `${__dirname}/frames`;
    await execute({
        path: `${rootPath}`,
        width: 1920*2, height: 1080*2,
        name: 'dev'
    });
})();

async function execute({path, width, height, name}) {

    // needs a new canvas everytime...
    const canvas = createCanvas(width, height);

    // draw the image
    await drawFrame(canvas);

    // save the image, dont await
    await exportCanvas(canvas, path, name);
}

async function exportCanvas(canvas, path, name) {
    await exportCanvasToImage(canvas, `${path}/${name}.png`);
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


