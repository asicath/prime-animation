
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

// hopeful
const config = {
    noteStart: 14,
    noteCount: 12,
    numberStart: 2000000,
    bpmStart: 300
};

//const activeNotes = allNotes.splice(19,7);
const activeNotes = allNotes.splice(config.noteStart, config.noteCount);

const notes = activeNotes.map(name => {
    return { name, isActive: false, isPlaying: false, factor: 0 }
});

let polySynth = null;
let n = config.numberStart;
let ranges = range.getRangeAt(n, notes.length);
let interval = null;

function start() {
    polySynth = new Tone.PolySynth(notes.length - 1, Tone.Synth).toMaster();

    let intervalTime = Math.floor((1000*60) / config.bpmStart);

    let prevTime = 0;
    interval = setInterval(() => {
        let now = Date.now();
        let time = now - prevTime;
        prevTime = now;

        next(time);

    }, intervalTime);
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

function setupDisplay() {
    $('#display').append(`<div id="n">n:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1</div>`);
    $('#display').append(`<div>&nbsp;</div>`);
    $('#display').append(`<div id="header">&nbsp;&nbsp;&nbsp;factors&nbsp;&nbsp;% of &#8734;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;range&nbsp;&nbsp;&nbsp;count</div>`);

    for (let l = 0; l < notes.length; l++) {
        let note = notes[l];
        $('#display').append('<div id="' + note.name + '"><div>' + note.name + '|<span class="value">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|</span></div></div>');
    }
}

$(function() {
    setupDisplay();
});

function next(time) {

    if (interval === null) return;

    $('#n').html('n:' + formatNumber(n, 8));

    let ranges = range.getRangeAt(n, notes.length);
    let factors = range.getPrimeFactors(n);

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

        // display
        let displayValue = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        if (note.isActive) {
            //displayValue = "++++";
            displayValue = formatNumber(note.factor, 7);
        }

        displayValue += '|';

        if (l < ranges.length) {
            let r = ranges[l];
            displayValue += ' ' + r.active.toFixed(4);
            //displayValue += ' ' + (r.next || 0).toFixed(4);
            displayValue += ' ' + formatNumber(r.start, 5) + '-' + formatNumber(r.end, 5);
            displayValue += '&nbsp;&nbsp;&nbsp;&nbsp;' + r.count;
        }
        
        $('#' + note.name + ' .value').html(displayValue);
    }

    n += 1;
}
