const visualEncodings = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size'];

export default function encode($p, vmap, colorManager) {
    var opacity = vmap.opacity || vmap.alpha;
    var vmapIndex = new Int32Array(visualEncodings.length);
    visualEncodings.forEach(function(code, codeIndex){
        vmapIndex[codeIndex] = $p.fields.indexOf(vmap[code]);
    })
    $p.uniform.uVisualEncodings.data = vmapIndex;
    $p.uniform.uDefaultAlpha.data = 1.0;
    if(vmapIndex[2] === -1) {
        if (typeof(vmap.color) === 'string'){
            if(vmap.color === 'auto') {
                $p.revealDensity = true;
                $p.uniform.uRevealMode.data = 1;
            } else {
                $p.uniform.uDefaultColor.data = colorManager.rgb(vmap.color);
            }
        } else {
            if(typeof(vmap.size) == 'number') {
                $p.uniform.uMarkSize = vmap.size;
            }
        }
    } else {
        if($p.categoryLookup.hasOwnProperty(vmap.color)) {
            $p.uniform.uColorMode = 0;
        } else {
            $p.uniform.uColorMode = 1;
        }
    }

    if(typeof(opacity) === 'number') {
        $p.uniform.uDefaultAlpha.data = opacity;
    } else if(vmapIndex[3] === -1 &&
        typeof(opacity) == 'string' &&
        opacity == 'auto'
    ) {
        $p.revealDensity = true;
        $p.uniform.uRevealMode.data = 0;
    }

    //Check if need interleaving data attributes(e.g.,parallel coordinates)
    if(Array.isArray(vmap.x) || Array.isArray(vmap.y)) {
        $p.renderMode = 'interleave';
        if(Array.isArray(vmap.x)){
            // vmap.x = vmap.x.reverse();
            $p.uniform.uInterleaveX = 0;
        }
        if(Array.isArray(vmap.y)) $p.uniform.uInterleaveX = 1;
    } else if(vmap.mark && ['rect', 'bar'].indexOf(vmap.mark) !== -1) {
        $p.renderMode = 'polygon';
    }

    if(vmapIndex[6] === -1 && typeof(vmap.size) == 'number') {
        $p.uniform.uMarkSize = vmap.size;
    }

    var viewSetting = {};
    var isRect = (['rect', 'bar'].indexOf(vmap.mark) !== -1);
    var markSpace = [0, 0];
    if(vmapIndex[0] > -1) {
        var len = $p.fieldWidths[vmapIndex[0]],
            ext = $p.fieldDomains[vmapIndex[0]];
        if($p.categoryLookup.hasOwnProperty(vmap.x)){
            viewSetting.scaleX = 'categorical';
             viewSetting.domainX = new Array(len).fill(0).map(
                 (d,i)=>$p.categoryLookup[vmap.x][i]
             );
         } else if (isRect) {
             viewSetting.scaleX = 'ordinal';
             viewSetting.domainX = new Array(len).fill(0).map((d,i)=>ext[0] + i);
         }
         markSpace[0] = 0.02;
    }
    if(vmapIndex[1] > -1) {
        var len = $p.fieldWidths[vmapIndex[1]],
            ext = $p.fieldDomains[vmapIndex[1]];

        if($p.categoryLookup.hasOwnProperty(vmap.y)){
             viewSetting.scaleY = 'categorical';
             viewSetting.domainY = new Array(len).fill(0).map(
                 (d,i)=>$p.categoryLookup[vmap.y][i]
             ).reverse();
        } else if (isRect) {
            viewSetting.scaleY = 'ordinal';
            viewSetting.domainY = new Array(len).fill(0).map((d,i)=>ext[0] + i).reverse();
        }
        markSpace[1] = 0.02;
    }

    if(vmapIndex[0] > -1 && vmapIndex[1] > -1) {
        markSpace = [0, 0];
    }

    $p.uniform.uMarkSpace.data = markSpace;

    if($p.intervals.hasOwnProperty(vmap.x) || $p.intervals.hasOwnProperty(vmap.y)) {
        var histDim = vmap.x || vmap.y,
            histMin = $p.intervals[histDim].min,
            histMax = $p.intervals[histDim].max,
            histIntv = $p.intervals[histDim].interval,
            histBin = (histMax - histMin) / histIntv;

        // viewSetting.fields = $p.fields;
        viewSetting.isHistogram = true;
        // viewSetting.domain = {};
        viewSetting.domainX = new Array(histBin).fill(histMin).map(function(h, i) {return h + i*histIntv});
    }

    if(!$p._update) {
        if(!vmap.width && vmap.x) {
            $p.uniform.uDefaultWidth.data = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.x)] );
        } else if(vmapIndex[4] === -1 && typeof(vmap.width) == 'number') {
            $p.uniform.uDefaultWidth.data = vmap.width / width;
        }

        if(!vmap.height && vmap.y) {
            $p.uniform.uDefaultHeight.data = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.y)] );
        } else if(vmapIndex[5] === -1 && typeof(vmap.width) == 'number') {
            $p.uniform.uDefaultHeight.data = vmap.height / height;
        }
    }
    return viewSetting;
}
