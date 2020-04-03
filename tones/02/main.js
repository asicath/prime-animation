//let a = notes.slice(i,i+1);

//a.push('A4');

//console.log(Tone.Transport.bpm.value);
//console.log(a, time);

//polySynth.triggerAttackRelease('A4', "1n", time);

//if (i < 2) polySynth.triggerAttackRelease('A3', "1n", time);

//polySynth.triggerAttackRelease(notes[i], "8n", time);
//i = (i+1) % notes.length;



const notes = ["A3", "B3", "C4", "D4", "E4", "F4", "G4"].map(name => {
    return {
        name,
        isActive: false,
        factor: 0
    }
});
let polySynth = null;
let n = 2;
let ranges = range.getRangeAt(n, notes.length);

function start() {
    polySynth = new Tone.PolySynth(7, Tone.Synth,{

        filterEnvelope : {
            attack : 0.06 ,
            decay : 0.2 ,
            sustain : 0.5 ,
            release : 1 ,
            baseFrequency : 200 ,
            octaves : 7 ,
            exponent : 2
        }
    }).toMaster();

    const loop = new Tone.Loop(time => {
        next(time);
    }, "1n");

    loop.start();

    Tone.Transport.start();
    Tone.Transport.bpm.value = 500;
    //Tone.Transport.bpm.rampTo(1000, 20);
}

function formatNumber(n, length) {
    let s = n.toString();
    while (s.length < length) {
        s = ' ' + s;
    }
    return s.replace(/\s/g, '&nbsp;');
}

function setupDisplay() {
    $('#display').append('<div id="n"></div>')
    for (let l = 0; l < notes.length; l++) {
        let note = notes[l];
        $('#display').append('<div id="' + note.name + '"><div>' + note.name + '|<span class="value">test</span></div></div>');
    }
}

$(function() {
    setupDisplay();
});

function next(time) {

    $('#n').html('&nbsp;&nbsp;&nbsp;' + formatNumber(n, 5));

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

        // set the note
        if (note.isActive) {
            polySynth.triggerAttackRelease(note.name, "1n", time);
        }

        // display
        let displayValue = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        if (note.isActive) {
            //displayValue = "++++";
            displayValue = formatNumber(note.factor, 5);
        }

        displayValue += '|';

        if (l < ranges.length) {
            let r = ranges[l];
            displayValue += ' ' + r.active.toFixed(4);
            //displayValue += ' ' + (r.next || 0).toFixed(4);
            displayValue += ' ' + formatNumber(r.start, 5) + '-' + formatNumber(r.end, 5);
            displayValue += ' ' + r.count;
        }
        
        $('#' + note.name + ' .value').html(displayValue);
    }

    n += 1;
}
