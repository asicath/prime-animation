
let Color = function () {

    let TrimPercent = function (percent) {
        while (percent > 1.0) { percent -= 1.0; }
        return percent;
    };

    let percentCache = {};

    let ByPercent = function (percent, full, alpha = 0.5) {

        // trim it
        percent = TrimPercent(percent);

        // narrow down to just a handful of possible values
        //let key = `K${Math.floor(percent * 100000)}-${Math.floor(alpha * 10000)}`;

        // Try to pull from cache
        //if (typeof percentCache[key] !== 'undefined') {
        //    return percentCache[key];
        //}

        let max = 6;
        let total = full * max; // Max num of colors that can be generated

        // The number representing the color that will be returned
        let i = Math.round(total * percent);

        //let full = 170;
        let empty = 0;
        let between = 0; //parseInt(parseFloat(full) * percent);

        let r = empty;
        let g = empty;
        let b = empty;
        let a = alpha; // 0.5; // No alpha

        if (percent < 1.0 / max) {
            // #FF++00 = FF0000 -> FFFF00
            between = i - full * 0;
            r = full;
            g = between;
            b = empty;
        } else if (percent < 2.0 / max) {
            // #--FF00
            between = i - full * 1;
            r = full - between;
            g = full;
            b = empty;
        } else if (percent < 3.0 / max) {
            // #00FF++
            between = i - full * 2;
            r = empty;
            g = full;
            b = between;
        } else if (percent < 4.0 / max) {
            // #00--FF = 00FFFF -> 0000FF
            between = i - full * 3;
            r = empty;
            g = full - between;
            b = full;
        } else if (percent < 5.0 / max) {
            // #++00FF = 0000FF -> FF00FF
            between = i - full * 4;
            r = between;
            g = empty;
            b = full;
        } else if (percent <= 6.0 / max) {
            // #FF00-- = FF00FF -> FF0000
            between = i - full * 5;
            r = full;
            g = empty;
            b = full - between;
        }

        // create the color
        color = `rgba(${r},${b},${g},${a})`;

        //percentCache[key] = color;

        return color;
    };

    let ByNumber = function (number, max, alpha) {

        // special case for 3 colors
        if (max === 3) {
            let i = number % 3;
            switch(i) {
                case 0:
                    return `rgba(255,0,0,${alpha})`;
                case 1:
                    return `rgba(0,255,0,${alpha})`;
                case 2:
                    return `rgba(0,0,255,${alpha})`;
            }
        }

        while (number > max) { number -= max; }
        return ByPercent(number / max, 170, alpha);
    };

    return {
        ByNumber: ByNumber,
    };

} ();

if (typeof exports !== "undefined") {
    exports.Color = Color;
}

//static public Color GetColorByPercent(double percent, int full) {
//			
//			percent = TrimPercent(percent);

//			if (colorPercents == null) {
//				colorPercents = new Dictionary<double, Color>();
//			}

//			if (colorPercents.ContainsKey(percent)) {
//				return colorPercents[percent];
//			}

//			double max = 6.0;
//			int total = full * (int)max; // Max num of colors that can be generated

//			// The number representing the color that will be returned
//			double ii = (double)total * percent;
//			int i = (int)Math.Round(ii);


//			//int full = 0xAA;
//			int empty = 0x00;
//			int between = (int)((double)full * percent);
//			int alpha = 0xff;

//			if (percent < 1.0 / max) {
//				between = i - full * 0;
//				colorPercents.Add(percent, Color.FromArgb(alpha, full, between, empty));		// #FF++00 = FF0000 -> FFFF00
//			} else if (percent < 2.0 / max) {
//				between = i - full * 1;
//				colorPercents.Add(percent, Color.FromArgb(alpha, full - between, full, empty));	// #--FF00
//			} else if (percent < 3.0 / max) {
//				between = i - full * 2;
//				colorPercents.Add(percent, Color.FromArgb(alpha, empty, full, between));		// #00FF++
//			} else if (percent < 4.0 / max) {
//				between = i - full * 3;
//				colorPercents.Add(percent, Color.FromArgb(alpha, empty, full - between, full));	// #00--FF = 00FFFF -> 0000FF
//			} else if (percent < 5.0 / max) {
//				between = i - full * 4;
//				colorPercents.Add(percent, Color.FromArgb(alpha, between, empty, full));		// #++00FF = 0000FF -> FF00FF
//			} else {
//				if (percent <= 6.0 / max) {
//					between = i - full * 5;
//					return Color.FromArgb(alpha, full, empty, full - between);					// #FF00-- = FF00FF -> FF0000
//				}

//				return Color.Black;
//			}
//			return colorPercents[percent];
//		}