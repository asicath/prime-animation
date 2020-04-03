const {Prime} = require('./prime');
const {Color} = require('./color');
const {EasingFunctions} = require('../easing');


let Kaph = function () {

    let canvas = null, ctx = null; // filled by init
    let drawMethod = null;

    const grey = "rgba(128,128,128, 1)";
    const capType = 'round';

    let radius; // radius of the circle
    let alphaBase = 0.5; // the alpha value of all line colors drawn
    let colorsPerRainbow = 120;

    // numbers that will be scaled
    let lineWidth, minLineLength, fontSize;

    let lineWidthInitial = 1.5; // radius of all lines drawn
    let minLineLengthInitial = 1; // min length of an individual prime line
    let fontSizeInitial = 18; // pixels
    const font = 'Consolas';

    let Init = function (a_canvas) {

        canvas = a_canvas;
        ctx = canvas.getContext('2d');

        //drawMethod = DrawWedge;
        drawMethod = DrawLine;

        // find scale
        const height = canvas.height;
        const scale = height / 1080; // base on 1080

        // apply scale
        lineWidth = lineWidthInitial * scale;
        minLineLength = minLineLengthInitial * scale;
        fontSize = fontSizeInitial * scale;
        ctx.font = `${Math.floor(fontSize)}px ${font}`;

        CalculateRadius();
    };

    let CalculateRadius = function () {
        let size = canvas.width;
        if (canvas.height < size) { size = canvas.height; }
        radius = (size * 0.95) / 2;
    };


    let Draw = function () {
        // static things:
        DrawCircle();
        drawMark();

        // stats
        DrawSpeed();
        DrawNumber();
        DrawTime();

        // draw moving things
        DrawPointer();
        //DrawPrimes();
        DrawPrimesInverted();
    };

    // draws the current number in the corner
    let DrawNumber = function () {
        let value = Math.floor(Prime.GetCurrentNumber() * 100) / 100;
        ctx.save();
        ctx.fillStyle = grey;
        ctx.fillText(`N: ${value}`, (fontSize*0.7), (fontSize * 1.5)*2);
    };

    // draws the current velocity stat in the corner
    let DrawSpeed = function () {
        const value = Math.floor(Prime.GetCountPerSecond() * 10) / 10;
        ctx.save();
        ctx.fillStyle = grey;
        ctx.fillText(`V: ${value}/s`, (fontSize*0.7), (fontSize * 1.5)*3);
    };

    // draws the current velocity stat in the corner
    let DrawTime = function () {
        let time = Prime.GetTime();
        let hh = Math.floor(time / (1000*60*60));
        time -= hh * (1000*60*60);
        let mm = Math.floor(time / (1000*60));
        time -= mm * (1000*60);
        let ss = Math.floor(time / (1000));

        hh = hh < 10 ? "0" + hh.toString() : hh.toString();
        mm = mm < 10 ? "0" + mm.toString() : mm.toString();
        ss = ss < 10 ? "0" + ss.toString() : ss.toString();

        ctx.save();
        ctx.fillStyle = grey;
        ctx.fillText(`${hh}:${mm}:${ss}`, (fontSize*0.7), (fontSize * 1.5)*1);
    };

    // draws the mark indicating the number 1
    let drawMark = function() {
        let count = Prime.GetCurrentNumber();
        drawMethod(Math.PI * 1.5, 1, grey, count);
    };

    let DrawPointer = function () {

        // dont draw if we are over 100
        let velocity = Prime.GetCountPerSecond();
        if (velocity > 3) return;

        // determine alpha of pointer by velocity
        let alpha = 1 - (velocity / 3);

        let count = Prime.GetCurrentNumber();
        let initialAngle = Math.PI * 1.5;
        let percent = count % 1;
        let angle = initialAngle + Math.PI * 2.0 * percent;

        let color = `rgba(255,255,255, ${alpha})`;

        drawMethod(angle, 1, color, count);
    };

    let DrawPrimes = function () {
        let number = Prime.GetCurrentNumber();
        for (let i = Prime.Current.length; i >= 0; i--) {
            DrawPrime(Prime.Current[i], number, null, i);
        }
    };

    let DrawPrimesInverted = function () {
        let number = Prime.GetCurrentNumber();
        //let maxNumber = Prime.Current[Prime.Current.length-1];
        for (let i = 0; i < Prime.Current.length; i++) {
            DrawPrime(Prime.Current[i], number, null, i);
        }
    };

    let ease = function(percent, pow) {
        return Math.pow(percent, pow);
    };

    let DrawPrime = function (n, count, color, iColor) {
        let initialAngle = Math.PI * 1.5;
        let percent = (count % n) / n;
        let angle = initialAngle + Math.PI * 2.0 * percent;

        //let lengthPercent = Math.log(n);
        //let lengthPercent = n / count; // normal

        let lengthPercentBase = 1 - (n / count); // invert

        // ease the percent
        //let easePercent = Math.min(1, currentNumber / 1000);
        //let easePower = Math.max(1, 10 * easePercent);

        let easePower = Math.log(count) * 0.5;
        const lengthPercent = ease(lengthPercentBase, easePower);

        // vary the alpha value as well
        let alphaValue = alphaBase;
        alphaValue *= ease(lengthPercentBase, easePower);

        if (color == null) { color = Color.ByNumber(iColor, colorsPerRainbow, alphaValue); }
        drawMethod(angle, lengthPercent, color, count);
    };

    let DrawWedge = function (angle, lengthPercent, color, count) {

        let aPerUnit = (Math.PI * 2) / 2000; // use count instead

        let a0 = (angle - aPerUnit / 2) % (Math.PI * 2);
        let a1 = (angle + aPerUnit / 2) % (Math.PI * 2);

        // Outside point (On circle)
        let x1 = Math.cos(a0) * radius;
        let y1 = Math.sin(a0) * radius;

        // The length of the line
        let length = lengthPercent * radius;

        // Ensure min length
        if (length < minLineLength) {
            length = minLineLength;
        }

        // The point inside the circle
        let x0 = Math.cos(a0) * (radius - length);
        let y0 = Math.sin(a0) * (radius - length);
        let x3 = Math.cos(a1) * (radius - length);
        let y3 = Math.sin(a1) * (radius - length);

        // Draw
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.beginPath();
        ctx.moveTo(x0, y0); // inside 1
        ctx.lineTo(x1, y1); // outside 1
        ctx.arc(0, 0, radius, a0, a1, false); // outside 2
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
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

