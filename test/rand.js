define(function(require){
    'use strict';
    function dist(d) {
        var r,
            d = d || 0,
            rand = Math.random;

        switch(d) {
            case 1:
                r = 0.3333 * (rand() + rand() + rand());
                break;
            case 2:
                r = Math.min(rand(), rand(), rand());
                break;
            case 3:
                r = Math.max(rand(), rand(), rand());
                break;
            case 4:
                r=rand() - rand() + rand() - rand();
                r += (r<0.0) ? 4.0 : 0.0;
                r *= 0.25;
                break;
            default:
                r = rand();
                break;
        }

        return r;
    }

    return function (arg){
        var options = arg || {},
            mode = options.mode || 0,
            min = options.min || 0,
            max = options.max || 1,
            dtype = options.dtype || Float32Array,
            length = options.length || 0;

        var randoms = new dtype(length);

        for(var i = 0; i < length; i++) {
            randoms[i] = min + (max - min) * dist(mode);
        }

        return randoms;
    }
});
