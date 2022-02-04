let xMax, yMax;
const full = Math.PI * 2;

Math.getDistance = function( x1, y1, x2, y2 ) {
    let xs = x2 - x1, ys = y2 - y1;
    xs *= xs;
    ys *= ys;
    return Math.sqrt( xs + ys );
};

function drawBackground(canvas, color) {
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = "#" + color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function fillCircle(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    //ctx.lineWidth = 3;
    //ctx.strokeStyle = grey;
    //ctx.stroke();
}

function move({x, y, a, distance}) {
    let xNext = Math.cos(a) * distance + x;
    let yNext = Math.sin(a) * distance + y;
    return {x:xNext, y:yNext, a};
}

function inBounds({x,y,radius}) {
    if (x - radius < 0 || y - radius < 0) return false;
    if (x + radius > xMax || y + radius > yMax) return false;
    return true;
}

function intersectAny(c0) {
    for (let i = 0; i < circles.length; i++) {
        let c1 = circles[i];

        let d = Math.getDistance(c0.x, c0.y, c1.x, c1.y);
        if (d < c0.radius + c1.radius)
            return true;
    }
    return false;
}

const stack = [];
const circles = [];
const colors = {
    white: '#fff',
    red: '#f00',
    green: '#0f0'
};

function drawFrame(canvas) {
    xMax = canvas.width;
    yMax = canvas.height;
    drawBackground(canvas, '000000');

    // put the initial on stack
    stack.push({x:canvas.width/2, y:canvas.height/2, a:0, count:0, process: cir1});

    let ctx = canvas.getContext('2d');
    let count = 0;
    while (stack.length > 0 && count < 100000) {
        count++;
        let o = stack.pop();
        let process = o.process;
        delete o.process;
        process(ctx, o);
    }

    // now draw
    console.log(`drawing ${circles.length} circles`);
    circles.forEach(c => {
        fillCircle(ctx, c.x, c.y, c.radius, c.color);
    });
}

module.exports.drawFrame = drawFrame;

function addIfOk(c) {
    if (!inBounds(c)) return false;
    if (intersectAny(c)) return false;
    circles.push(c);
    return true;
}

function cir1(ctx, {x, y, a}) {
    let c = {x, y, radius: 20, color: colors.white};
    if (!addIfOk(c)) return;

    // add some greens
    stack.push(Object.assign(
        move({x, y, a: a + full * 0.25, distance: c.radius*4+2}),
        {
            a: (a) % full,
            process: cir3
        }));
return;
    // add a red
    stack.push(Object.assign(
        move({x, y, a, distance: c.radius*2+2}),
        {
            a: (a + full * 0.98) % full,
            process: cir2
        }));
}

function cir2(ctx, {x, y, a}) {
    let c = {x, y, radius: 10, color: colors.red};
    if (!addIfOk(c)) return;

    // back to white
    stack.push(Object.assign(
        move({x, y, a, distance: c.radius*4+2}),
        {
            a: (a + full * 1.01) % full,
            process: cir1
        }));
}

function cir3(ctx, {x, y, a}) {
    let c = {x, y, radius: 5, color: colors.green};
    if (!addIfOk(c)) return;

    // back to white
    stack.push(Object.assign(
        move({x, y, a, distance: c.radius*4+2}),
        {
            process: cir1
        }));
}


