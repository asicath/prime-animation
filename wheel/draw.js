const {Prime} = require('./prime');
const {Color} = require('./color');
const {EasingFunctions} = require('../easing');


let Kaph = function () {

    let blue = "rgba(0,0,255, 0.5)";
    let red = "rgba(255,0,0, 0.5)";
    let grey = "rgba(128,128,128, 1)";


    let radius;
    let lineWidth = 1;
    //let minLineLength = 10;
    let minLineLength = 1;
    let c;
    let capType = 'round';
    let power = 0.5;
    let alpha = 0.5;
    let canvas = null;

    let Init = function (a_canvas) {
        canvas = a_canvas;

        const height = canvas.height;
        const scale = height / 1080; // base on 1080

        lineWidth = 1.5 * scale;
        minLineLength = 1 * scale;

        c = canvas.getContext('2d');
        CalculateRadius();
        //Timer.AddEvent(Draw);
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
        DrawAcceleration();
    };

    let DrawAcceleration = function () {
        c.save();
        //c.translate(canvas.width / 2, canvas.height / 2);
        c.font = '18px Arial';
        c.fillStyle = 'grey';
        c.fillText(('' + Prime.Acceleration()).substring(0, 6), 20, 30);
        //c.restore();
    };

    let DrawSpeed = function () {
        c.save();
        //c.translate(canvas.width / 2, canvas.height / 2);
        c.font = '18px Arial';
        c.fillStyle = 'grey';
        c.fillText(('' + Prime.GetCountPerSecond()).substring(0, 4), 20, 50);
        //c.restore();
    };

    let DrawNumber = function () {
        c.save();
        //c.translate(canvas.width / 2, canvas.height / 2);
        c.font = '18px Arial';
        c.fillStyle = 'grey';
        c.fillText(('' + Prime.GetLastWholeNumber()).substring(0, 7), 20, 70);
        //c.restore();
    };

    let DrawOne = function () {
        let maxNumber = Prime.Current.length === 0 ? 1 : Prime.Current[Prime.Current.length-1];

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
        let maxNumber = Prime.Current[Prime.Current.length-1];
        for (let i = 0; i <=  Prime.Current.length; i++) {
            DrawPrime(Prime.Current[i], number, null, maxNumber);
        }
    };

    let ease = function(percent, pow) {
        return Math.pow(percent, pow);
    };

    let DrawPrime = function (number, count, color, maxNumber) {
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
        let easePercent = Math.min(1, maxNumber / 1000);
        //let easePower = Math.max(1, 10 * easePercent);

        let easePower = Math.log(maxNumber) * 0.5;
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
        c.save();
        c.translate(canvas.width / 2, canvas.height / 2);
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.lineWidth = lineWidth;
        c.strokeStyle = color;
        c.lineCap = capType;
        c.stroke();
        c.restore();
    };

    let DrawCircle = function () {

        let x = 0;
        let y = 0;

        c.save();

        c.translate(canvas.width / 2, canvas.height / 2);

        c.beginPath();
        c.arc(x, y, radius, 0, Math.PI * 2, false);
        c.closePath();
        c.lineWidth = 3;
        c.strokeStyle = grey;
        c.lineCap = capType;
        c.stroke();

        c.restore();
    };

    return {
        Init,
        Draw,
        CalculateRadius,
        Lower: function(){power -= 0.1;},
        Raise: function () { power += 0.1; }
    };

} ();

if (typeof exports !== "undefined") {
    exports.Kaph = Kaph;
}
