const {Prime} = require('./prime');
const {Color} = require('./color');
const {EasingFunctions} = require('../easing');


let Kaph = function () {

    let canvas = null, ctx = null; // filled by init

    const blue = "rgba(0,0,255, 0.5)";
    const red = "rgba(255,0,0, 0.5)";
    const grey = "rgba(128,128,128, 1)";
    const capType = 'round';

    let radius; // radius of the circle
    let alpha = 0.5; // the alpha value of all line colors drawn

    // numbers that will be scaled
    let lineWidth = 1.5; // radius of all lines drawn
    let minLineLength = 1; // min length of an individual prime line
    let fontSize = 18; // pixels

    let Init = function (a_canvas) {

        canvas = a_canvas;
        ctx = canvas.getContext('2d');

        // find scale
        const height = canvas.height;
        const scale = height / 1080; // base on 1080

        // apply scale
        lineWidth *= scale;
        minLineLength *= scale;
        fontSize *= scale;
        ctx.font = `${Math.floor(fontSize)}px Consolas`;

        CalculateRadius();
    };

    let CalculateRadius = function () {
        let size = canvas.width;
        if (canvas.height < size) { size = canvas.height; }
        radius = (size * 0.95) / 2;
    };

    let Draw = function (time, totalTime) {

        DrawCircle();
        DrawOne();
        //DrawPrimes();
        DrawPrimesInverted();
        DrawSpeed();
        DrawNumber();
    };

    let DrawSpeed = function () {
        const value = Math.floor(Prime.GetCountPerSecond() * 10) / 10;
        ctx.save();
        ctx.fillStyle = 'grey';
        ctx.fillText(`V: ${value}/s`, (fontSize*0.7), (fontSize * 1.5)*2);
    };

    let DrawNumber = function () {

        let value = Math.floor(Prime.GetCurrentNumber() * 100) / 100;
        ctx.save();
        ctx.fillStyle = 'grey';
        ctx.fillText(`N: ${value}`, (fontSize*0.7), (fontSize * 1.5));
    };

    let DrawOne = function () {
        //let maxNumber = Prime.Current.length === 0 ? 1 : Prime.Current[Prime.Current.length-1];

        let count = Prime.GetCurrentNumber();
        //DrawPrime(1, 1, grey, maxNumber);

        DrawLine(Math.PI * 1.5, 1, grey);

        let initialAngle = Math.PI * 1.5;
        let percent = (count % 1) / 1;
        let angle = initialAngle + Math.PI * 2.0 * percent;
        DrawLine(angle, 1, 'white');
        //DrawPrime(1, number, 'white', maxNumber);
    };

    let DrawPrimes = function () {
        let number = Prime.GetCurrentNumber();
        for (let i = Prime.Current.length; i >= 0; i--) {
            DrawPrime(Prime.Current[i], number, null);
        }
    };

    let DrawPrimesInverted = function () {
        let number = Prime.GetCurrentNumber();
        //let maxNumber = Prime.Current[Prime.Current.length-1];
        for (let i = 0; i <=  Prime.Current.length; i++) {
            DrawPrime(Prime.Current[i], number, null);
        }
    };

    let ease = function(percent, pow) {
        return Math.pow(percent, pow);
    };

    let DrawPrime = function (number, count, color) {
        let initialAngle = Math.PI * 1.5;
        let percent = (count % number) / number;
        let angle = initialAngle + Math.PI * 2.0 * percent;

        //let lengthPercent = Math.log(number);

        //let lengthPercent = number / count; // normal

        let lengthPercent = 1 - (number / count); // invert

        //let lengthPercent = Math.log(number / count) / Math.log(1);
        //let lengthPercent = Math.log(number) / Math.log(count*power);

        //lengthPercent = Math.pow(lengthPercent, power);

        lengthPercent = lengthPercent >= 1 ? 1 : lengthPercent;

        // ease the percent
        let easePercent = Math.min(1, count / 1000);
        //let easePower = Math.max(1, 10 * easePercent);

        let easePower = Math.log(count) * 0.5;
        lengthPercent = ease(lengthPercent, easePower);



        if (color == null) { color = Color.ByNumber(number, 1000, alpha); }
        DrawLine(angle, lengthPercent, color);
    };

    let DrawLine = function (angle, lengthPercent, color) {

        // Outside point (On circle)
        let x1 = Math.cos(angle) * radius;
        let y1 = Math.sin(angle) * radius;

        // The length of the line
        let length = lengthPercent * radius;

        // Ensure min length
        if (length < minLineLength) {
            length = minLineLength;
        }

        // The point inside the circle
        let x2 = Math.cos(angle) * (radius - length);
        let y2 = Math.sin(angle) * (radius - length);

        // Draw
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = capType;
        ctx.stroke();
        ctx.restore();
    };

    let DrawCircle = function () {

        let x = 0;
        let y = 0;

        ctx.save();

        ctx.translate(canvas.width / 2, canvas.height / 2);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = grey;
        ctx.lineCap = capType;
        ctx.stroke();

        ctx.restore();
    };

    return {
        Init,
        Draw,
        CalculateRadius
    };

} ();

if (typeof exports !== "undefined") {
    exports.Kaph = Kaph;
}
