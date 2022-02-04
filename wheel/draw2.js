//const {Prime} = require('./prime');
const {Color} = require('./color');
const {EasingFunctions} = require('../easing');
const {PrimeBucketRunner} = require('../wav/prime-buckets');

const briBase = 30;
const briHigh = 150;

const colorsHigh = [
    {r:174,g:14,b:54},
    {r:237,g:40,b:0},
    {r:255,g:78,b:0},
    {r:255,g:109,b:0},
    {r:255,g:183,b:52},
    {r:229,g:215,b:8},
    {r:89,g:185,b:52},

    {r:0,g:165,b:80},
    {r:0,g:149,b:141},
    {r:0,g:133,b:202},
    //{r:0,g:20,b:137}, //
    {r:0,g:34,b:230},
    {r:92,g:0,b:204}
];

const colorsLow = colorsHigh.map(color => {
    const p = briBase / (briBase + briHigh);
    return {
        r: Math.floor(color.r * p),
        g: Math.floor(color.g * p),
        b: Math.floor(color.b * p)
    };
});

let Kaph = function () {

    let canvas = null, ctx = null; // filled by init
    let drawMethod = null;

    const layerCount = 12; // plus two for inner and outermost

    const primeBucketRunner = new PrimeBucketRunner(12);
    let state = primeBucketRunner.getCurrentState(); // state of 1
    primeBucketRunner.step();
    let nextState = primeBucketRunner.getCurrentState(); // state of 2

    const radii = [];
    for (let i = 0; i < layerCount+2; i++) {
        let p = (i+1) / (layerCount+2);
        radii[i] = Math.pow(p, 1.618);
    }

    const grey = "rgba(255,255,255, 0.25)";
    const capType = 'round';

    let radius; // radius of the circle
    let alphaBase = 0.5; // the alpha value of all line colors drawn

    // numbers that will be scaled
    let lineWidth, minLineLength, fontSize;

    let lineWidthInitial = 1.5; // radius of all lines drawn
    let minLineLengthInitial = 1; // min length of an individual prime line
    let fontSizeInitial = 18; // pixels
    const font = 'Consolas';

    const darkRadiusPerLayer_beforeScale = 2;
    let darkRadiusPerLayer = null;

    let scale = 1;

    let Init = function (a_canvas) {

        canvas = a_canvas;
        ctx = canvas.getContext('2d');

        //drawMethod = DrawWedge;
        //drawMethod = DrawLine;
        drawMethod = DrawLineSmall;

        // find scale
        const height = canvas.height;
        scale = height / 1080; // base on 1080

        // apply scale
        lineWidth = lineWidthInitial * scale;
        darkRadiusPerLayer = darkRadiusPerLayer_beforeScale * scale;
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


    const Draw = function (n) {

        // determine where we are
        const numberCurrent = Math.floor(n);
        const numberNext = numberCurrent + 1;

        // make sure primeBucketRunner is up to count
        while (primeBucketRunner.n < numberNext) {
            state = nextState;
            primeBucketRunner.step();
            nextState = primeBucketRunner.getCurrentState();
        }

        // static things:
        DrawCircle(n);
        DrawMark(n);

        // stats
        //DrawSpeed();
        DrawNumber(n);
        //DrawTime();
        DrawBucketInfo(n);

        // draw moving things
        DrawPointer(n);
        //DrawPrimes();
        DrawPrimesInverted(n);
    };

    const getColor = function (index, briPercent) {
        // create the color string
        const high = colorsHigh[index];
        const low = colorsLow[index];
        const rgb = {
            r: low.r + Math.floor((high.r - low.r) * briPercent),
            g: low.g + Math.floor((high.g - low.g) * briPercent),
            b: low.b + Math.floor((high.b - low.b) * briPercent)
        };
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    const DrawCircle = function (n) {

        // glow percent
        const percent = 1 - (n % 1);

        for (let i = radii.length-1; i >= 0; i--) {

            // find the radius
            const r = radius * radii[i];

            // vary the alpha value as well?
            let alphaValue = 1; // fix for now

            let color = null;

            if (i === 0) {

                if (state.isPrime) {
                    const bri = Math.floor(percent * 225 + 30);
                    color = `rgb(${bri}, ${bri}, ${bri})`;
                }
                else {
                    color = 'rgb(30, 30, 30)';
                }


                FillCircle(color, r);
            }
            else if (i === radii.length - 1) {
                // nothing, just leave black
            }
            else {
                const note = state.notes[i-1];

                // find bright percent
                let briPercent = 0;
                if (note.active) {
                    const nextNote = nextState.notes[i-1];
                    if (nextNote.active) briPercent = 1;
                    else briPercent = percent;
                }

                const darkLayers = 5;
                const maxDarkPercent = 0.1;

                for (let j = 0; j < darkLayers; j++) {
                    let darkenPercent = (darkLayers-j) / darkLayers;
                    darkenPercent = Math.pow(darkenPercent, 1.618);

                    color = getColor(i-1, briPercent - darkenPercent * maxDarkPercent);
                    FillCircle(color, r-(j*darkRadiusPerLayer));
                }
            }
        }

        // now the border
        // ctx.beginPath();
        // ctx.arc(x, y, radius, 0, Math.PI * 2, false);
        // ctx.closePath();
        // ctx.lineWidth = 3;
        // ctx.strokeStyle = grey;
        // ctx.lineCap = capType;
        // ctx.stroke();
    };

    const FillCircle = function (color, radius) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.restore();
    }

    // draws the mark indicating the number 1
    const DrawMark = function(n) {
        let count = n;

        const percent = 1 - (n % 1);

        let color = null;
        if (state.isPrime) {
            const bri = percent * 0.75 + 0.25;
            color = `rgba(255, 255, 255, ${bri})`;
        }
        else {
            color = 'rgba(255, 255, 255, 0.25)';
        }

        DrawLine(Math.PI * 1.5, 0, radii[radii.length-2]*radius, color, 1);
    };


    // draws the current velocity stat in the corner
    // let DrawSpeed = function () {
    //     const value = Math.floor(Prime.GetCountPerSecond() * 10) / 10;
    //     ctx.save();
    //     ctx.fillStyle = grey;
    //     ctx.fillText(`V: ${value}/s`, (fontSize*0.7), (fontSize * 1.5)*3);
    // };

    // draws the current number in the corner
    let DrawNumber = function (n) {
        let value = Math.floor(n * 100) / 100;
        ctx.save();
        ctx.fillStyle = grey;
        ctx.fillText(`N: ${value}`, (fontSize*0.7), (fontSize * 1.5)*2);
    };

    const DrawBucketInfo = function(n) {
        const x = scale * 1600;
        const y = scale * 800;


        for (let i = 0; i < state.buckets.length; i++) {
            ctx.fillStyle = grey;

            
            ctx.fillText(`BUCKETS`, x, y + fontSize * i);
        }
    }

    // draws the current velocity stat in the corner
    // let DrawTime = function () {
    //     let time = Prime.GetTime();
    //     let hh = Math.floor(time / (1000*60*60));
    //     time -= hh * (1000*60*60);
    //     let mm = Math.floor(time / (1000*60));
    //     time -= mm * (1000*60);
    //     let ss = Math.floor(time / (1000));
    //
    //     hh = hh < 10 ? "0" + hh.toString() : hh.toString();
    //     mm = mm < 10 ? "0" + mm.toString() : mm.toString();
    //     ss = ss < 10 ? "0" + ss.toString() : ss.toString();
    //
    //     ctx.save();
    //     ctx.fillStyle = grey;
    //     ctx.fillText(`${hh}:${mm}:${ss}`, (fontSize*0.7), (fontSize * 1.5)*1);
    // };


    let DrawPointer = function (n) {

        // dont draw if we are over 100
        //let velocity = Prime.GetCountPerSecond();
        //if (velocity > 3) return;

        // determine alpha of pointer by velocity
        //let alpha = 1 - (velocity / 3);
        let alpha = 1;

        let count = n;
        let initialAngle = Math.PI * 1.5;
        let percent = count % 1;
        let angle = initialAngle + Math.PI * 2.0 * percent;

        let color = `rgba(255,255,255, ${alpha})`;

        drawMethod(angle, -1, color, 1);
    };


    let DrawPrimesInverted = function (n) {
        let number = n;
        //let maxNumber = Prime.Current[Prime.Current.length-1];

        // draw the primes from each bucket

        //for (let i = primeBucketRunner.buckets.length - 1; i >= 0; i--) {
        for (let i = 0; i < state.buckets.length; i++) {
            const bucket = state.buckets[i];
            for (let j = bucket.primes.length - 1; j >= 0; j--) {
                DrawPrime(bucket.primes[j], number, i, state.buckets.length, bucket.primes.length, n);
            }
        }

        for (let i = 0; i < state.primeQueue.length; i++) {
            DrawPrime(state.primeQueue[i], number, radii.length-2, -1, state.primeQueue.length, n);
        }
    };

    let ease = function(percent, pow) {
        return Math.pow(percent, pow);
    };

    let DrawPrime = function (n, count, colorIndex, colorCount, bucketSize, nDraw) {
        let initialAngle = Math.PI * 1.5;
        let percentAngle = (count % n) / n;
        let angle = initialAngle + Math.PI * 2.0 * percentAngle;

        // find line width percent
        const bucketFallStart = 10;
        let lineWidthPercent = 1;
        if (bucketSize >= bucketFallStart) {
            const p = 1 / Math.log(bucketSize);
            lineWidthPercent = p;
        }

        //color = Color.ByNumber(radii.length - i, state.buckets.length+1, 1, 30);
        let color = "";
        let isMoving = false;
        let movingToIndex = -1;

        // in the prime queue
        if (colorIndex === radii.length-2) {

            // active prime, glow from white down to 0.3
            if (n === state.n) {
                const percent = (nDraw % 1);
                const bri = (1-percent) * 0.7 + 0.3;
                color = `rgba(255,255,255,${bri})`;

                // move from 1 to lineWidthPercent with the brightness
                lineWidthPercent = (1-percent) + percent * lineWidthPercent;
            }
            // all other primes in queue
            else {
                color = 'rgba(255,255,255,0.3)';
            }

            if (nextState.primeQueue.indexOf(n) === -1) {
                isMoving = true;

                let i = 0;
                while (movingToIndex === -1) {
                    if (nextState.buckets[i].primes.indexOf(n) !== -1) {
                        movingToIndex = i;
                    }
                    else {
                        i++;
                    }
                }
            }
        }
        // a prime in the colored bands
        else {
            //color = Color.ByNumber((colorCount - colorIndex)+1, colorCount+1, alphaValue);
            const c = colorsHigh[colorIndex];
            if (!c.lineColor) {
                let alphaValue = 1; // fix for now
                c.lineColor = `rgba(${c.r}, ${c.g}, ${c.b}, ${alphaValue})`;
            }
            color = c.lineColor;

            // if the next state doesnt have the number,
            if (nextState.buckets[colorIndex].primes.indexOf(n) === -1) {
                isMoving = true;
                movingToIndex = colorIndex - 1;
            }
        }

        if (isMoving) {
            const percent = 1 - (nDraw % 1);
            DrawLineMoving(angle, colorIndex, movingToIndex, percent, color, lineWidthPercent);
        }
        else {
            DrawLineSmall(angle, colorIndex, color, lineWidthPercent);
        }

    };

    let DrawLineSmall = function (angle, radiusIndex, color, lineWidthPercent = 1) {

        const radiusStart = radiusIndex === -1 ? 0 : (radii[radiusIndex]) * radius;
        const radiusEnd = (radii[radiusIndex+1]) * radius;

        DrawLine(angle, radiusStart, radiusEnd, color, lineWidthPercent);
    };

    let DrawLineMoving = function (angle, radiusIndex0, radiusIndex1, percent, color, lineWidthPercent = 1) {

        percent = EasingFunctions.easeInOutQuad(percent);

        const radiusStart0 = radiusIndex0 === -1 ? 0 : (radii[radiusIndex0]) * radius;
        const radiusEnd0 = (radii[radiusIndex0+1]) * radius;

        const radiusStart1 = radiusIndex1 === -1 ? 0 : (radii[radiusIndex1]) * radius;
        const radiusEnd1 = (radii[radiusIndex1+1]) * radius;

        const radiusStart = radiusStart0 * percent + radiusStart1 * (1-percent);
        const radiusEnd = radiusEnd0 * percent + radiusEnd1 * (1-percent);

        DrawLine(angle, radiusStart, radiusEnd, color, lineWidthPercent);
    };

    let DrawLineLong = function (angle, radiusIndex, color, lineWidthPercent = 1) {

        const lengthPercent = 1 - radii[radiusIndex];

        // The length of the line
        let length = lengthPercent * radius;

        // Ensure min length
        if (length < minLineLength) {
            length = minLineLength;
        }

        const radiusStart = (radius - length);

        DrawLine(angle, radiusStart, radius, color, lineWidthPercent);
    };

    const DrawLine = function(angle, radiusStart, radiusEnd, color, lineWidthPercent) {
        // Outside point (On circle)
        let x1 = Math.cos(angle) * radiusEnd;
        let y1 = Math.sin(angle) * radiusEnd;

        // The point inside the circle
        let x2 = Math.cos(angle) * radiusStart;
        let y2 = Math.sin(angle) * radiusStart;

        // Draw
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = lineWidth * lineWidthPercent;
        ctx.strokeStyle = color;
        ctx.lineCap = capType;
        ctx.stroke();
        ctx.restore();
    }

    return {
        Init,
        Draw,
        CalculateRadius
    };

} ();

if (typeof exports !== "undefined") {
    exports.Kaph = Kaph;
}

