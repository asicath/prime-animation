
// first generate the notes that can be played
const letters = ['C','D','E','F','G','A','B'];
const allNotes = [];
for (let i = 1; i <= 5; i++) {
    letters.forEach(l => {
        allNotes.push(l + i.toString());
    })
}

// youtube recording
// const config = {
//     noteStart: 7, // 19 was original
//     noteCount: 12,
//     numberStart: 2,
//     bpmStart: 300
// };

//const numberStart = 1000000;
const numberStart = 10;

// hopeful
const themeHopeful = {
    name: 'hopeful',

    noteStart: 14,
    noteCount: 12,

    bpmStart: 210,
    bpmTarget: 300,
    bpmTargetAt: 1000000,
    bpmIncreaseFn: 'ln'
};

const themeGoth = {
    name: 'inevitable',

    noteStart: 12,
    noteCount: 7,

    bpmStart: 170,
    bpmTarget: 220,
    bpmTargetAt: 1000000,
    bpmIncreaseFn: 'ln'
};

const config = themeHopeful;

//const activeNotes = allNotes.splice(19,7);
const activeNotes = allNotes.splice(config.noteStart, config.noteCount);

const notes = activeNotes.map(name => {
    return { name, isActive: false, isPlaying: false, factor: 0 }
});

let polySynth = null;
let n = numberStart;
let bpm = config.bpmStart;
let ranges = range.getRangeAt(n, notes.length);
let interval = null;
let waitTime = -1;

function start() {
    polySynth = new Tone.PolySynth(notes.length - 1, Tone.Synth).toMaster();

    // determine the rate of increase of bpm
    let bpmFactor = (config.bpmTarget - config.bpmStart) / Math.log(config.bpmTargetAt);

    let prevTime = 0;
    let loop = () => {

        let frameStart = Date.now();
        let time = frameStart - prevTime;

        // advance the frame
        next();

        let frameTime = Date.now() - frameStart;
        prevTime = frameStart;

        bpm = config.bpmStart + Math.log(n) * bpmFactor;
        let wait = Math.max(0, Math.floor((1000*60) / bpm) - frameTime);
        //waitTime = wait; // TODO debug only
        //console.log(wait);
        interval = setTimeout(loop, wait);

        // TODO, put the calculations for the next loop here
    };

    loop();
}

function restart() {

}

function pause() {

    clearInterval(interval);
    interval = null;

    for (let l = 0; l < notes.length; l++) {
        let note = notes[l];

        // if note is not active, but is playing
        if (note.isPlaying) {
            // turn it off
            polySynth.triggerRelease(note.name);
            note.isPlaying = false;
        }
    }

}

function formatNumber(n, length) {
    let s = n.toString();
    while (s.length < length) {
        s = ' ' + s;
    }
    return s.replace(/\s/g, '&nbsp;');
}

function padNumberAlignRight(n, length) {
    let s = n.toString();
    while (s.length < length) {
        s = ' ' + s;
    }
    return s.replace(/\s/g, '&nbsp;');;
}
function padNumberAlignLeft(n, length) {
    let s = n.toString();
    while (s.length < length) {
        s = s + ' ';
    }
    return s.replace(/\s/g, '&nbsp;');;
}


function setupDisplay() {
    $('#display').append(`<div id="n"></div>`);
    $('#display').append(`<div>&nbsp;</div>`);
    $('#display').append(`<div id="header">&nbsp;&nbsp;&nbsp;factors&nbsp;&nbsp;% of &#8734;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;range&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;count</div>`);

    for (let l = 0; l < notes.length; l++) {
        let note = notes[l];
        $('#display').append('<div id="' + note.name + '"><div>' + note.name + '|<span class="value">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|</span></div></div>');
    }

    // show the config
    //let text = JSON.stringify(config, null, 2);

    let text = `theme: "${config.name}"
&nbsp;&nbsp;first note: ${activeNotes[0]}
&nbsp;&nbsp;note count: ${config.noteCount}
&nbsp;&nbsp;bpm start: ${config.bpmStart}
&nbsp;&nbsp;bpm target: ${config.bpmTarget}
&nbsp;&nbsp;bpm target at: ${config.bpmTargetAt}
&nbsp;&nbsp;bpm increase function: log<sub>e</sub>`;


    text = text.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;');
    $('#config').html(text);
}

$(function() {
    setupDisplay();
    updateDisplay();
});

function updateDisplay(ranges = null) {

    let topRow = `n:${padNumberAlignRight(n, 8)}&nbsp;&nbsp;bpm:${formatNumber(Math.floor(bpm), 4)}`;
    if (waitTime > -1) topRow += padNumberAlignRight(waitTime, 8);
    $('#n').html(topRow);

    for (let l = 0; l < notes.length; l++) {
        let note = notes[l];

        // display
        let displayValue = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        if (note.isActive) {
            //displayValue = "++++";
            displayValue = formatNumber(note.factor, 7);
        }

        displayValue += '|';

        if (ranges !== null && l < ranges.length) {
            let r = ranges[l];
            displayValue += ' ' + r.active.toFixed(4);
            //displayValue += ' ' + (r.next || 0).toFixed(4);
            displayValue += ' ' + padNumberAlignRight(r.start, 7) + '-' + padNumberAlignLeft(r.end, 7);
            displayValue += padNumberAlignRight(r.count, 6);
        }

        $('#' + note.name + ' .value').html(displayValue);
    }
}

function next() {

    if (interval === null) return;

    let ranges = range.getRangeAt(n, notes.length);
    let factors = Prime.getPrimeFactors(n);

    // reset isActive
    for (let i = 0; i < notes.length; i++) {
        notes[i].isActive = false;
        notes[i].factor = 0;
    }

    // find any that are active
    for (let i = 0; i < factors.length; i++) {
        let f = factors[i];
        if (f === n) continue;
        for (let j = 0; j < ranges.length; j++) {
            if (f >= ranges[j].start && f <= ranges[j].end) {
                notes[j].isActive = true;
                notes[j].factor = f;
            }
        }
    }

    // set the tones, and display
    for (let l = 0; l < notes.length; l++) {
        let note = notes[l];

        // if the note is active and is not playing
        if (note.isActive && !note.isPlaying) {
            //polySynth.triggerAttackRelease(note.name, "1n", time);

            // turn it on
            polySynth.triggerAttack(note.name);
            note.isPlaying = true;
        }

        // if note is not active, but is playing
        else if (!note.isActive && note.isPlaying) {
            // turn it off
            polySynth.triggerRelease(note.name);
            note.isPlaying = false;
        }

    }

    updateDisplay(ranges);

    n += 1;
}
