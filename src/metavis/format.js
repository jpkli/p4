import {seq} from '../arrays';

export default function printformat(spec) {
    return function(value){
        if(typeof value !== "number") return value;
        var ret,
            convert,
            numericSymbols = ['y', 'z', 'a', 'f', 'p', 'n', 'µ', 'm', '', 'k', 'M','G', 'T', 'P', 'E', 'Z', 'Y'],
            n = seq(-24,24,3),
            i = numericSymbols.length-1,
            parts,
            precision = spec.match(/\d+/)[0] || 3,
            number = Number(value),
            exp,
            suffix;

        if(spec[spec.length-1] == 's')
            precision--;

        parts = number.toExponential(precision).toString().match(/^(-{0,1})(\d+)\.?(\d*)[eE]([+-]?\d+)$/);
        exp = parseInt(parts[4]) || 0;

        while (i--) {
            if (exp >= n[i]) {
                if(i==7 && (exp-n[i]) > 1) {
                    // console.log(exp-n[i]);
                    suffix = numericSymbols[i+1];
                    exp -= n[i+1];
                    break
                } else {
                    suffix = numericSymbols[i];
                    exp -= n[i];
                    break;
                }
            }
        }
        ret = parseFloat(parts[1] + parts[2] + '.' + (parts[3]||0) + 'e' + exp.toString());
        return ret.toString() + suffix;
    }
}
