export const EncodingChannels = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size']

export function encode($p, vmap, colorManager) {
    let opacity = vmap.opacity || vmap.alpha;
    let vmapIndex = new Int32Array(EncodingChannels.length);
    let scaleExponents = new Float32Array(EncodingChannels.length).fill(1.0);
    
    EncodingChannels.forEach((channel, channelIndex) => {
        let encoding = vmap[channel];
        if (typeof(encoding) == 'object' && encoding.hasOwnProperty('field')) {
            if(encoding.exponent !== 1.0) {
                scaleExponents[channelIndex] = encoding.exponent;
            }
            encoding = vmap[channel].field;
        }
        vmapIndex[channelIndex] = $p.fields.indexOf(encoding);
    })
    $p.uniform.uVisualEncodings.data = vmapIndex;
    $p.uniform.uScaleExponents.data = scaleExponents;
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
                $p.uniform.uMarkSize.data = vmap.size;
            }
        }
    } else {
        if($p.strLists.hasOwnProperty($p.fields[vmapIndex[2]])) {
            $p.uniform.uColorMode.data = 0;
        } else {
            $p.uniform.uColorMode.data = 1;
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
        // $p.uniform.uDefaultAlpha.data = 1.0;
    }

    if(vmapIndex[6] === -1 && typeof(vmap.size) == 'number') {
        $p.uniform.uMarkSize.data = vmap.size;
    }

    let viewSetting = {scale: {}, histogram: {}};
    let isRect = (['rect', 'bar'].indexOf(vmap.mark) !== -1);
    let markSpace = [0, 0];
    let isXYCategorical = [0, 0];
    if(vmapIndex[0] > -1) {
        let len = $p.fieldWidths[vmapIndex[0]];
        let ext = $p.fieldDomains[vmapIndex[0]];
        if($p.strLists.hasOwnProperty(vmap.x)){
            viewSetting.scale.x = 'categorical';
            viewSetting.domainX = new Array(len).fill(0).map(
                (d,i) => $p.strLists[vmap.x][i]
            );
            isXYCategorical[0] = 1;
         } else if (isRect) {
            viewSetting.scale.x = 'ordinal';
            viewSetting.domainX = new Array(len).fill(0).map((d,i) => ext[0] + i);
         }
         markSpace[0] = 0.02;

    }
    if(vmapIndex[1] > -1) {
        let len = $p.fieldWidths[vmapIndex[1]];
        let ext = $p.fieldDomains[vmapIndex[1]];

        if($p.strLists.hasOwnProperty(vmap.y)){
            viewSetting.scale.y = 'categorical';
            viewSetting.domainY = new Array(len).fill(0).map(
                (d,i)=>$p.strLists[vmap.y][i]
            );
            isXYCategorical[1] = 1;
        } else if (isRect) {
            viewSetting.scale.y = 'ordinal';
            viewSetting.domainY = new Array(len).fill(0).map((d,i)=>ext[0] + i);
        }
        markSpace[1] = 0.1;
    }

    if(vmapIndex[0] > -1 && vmapIndex[1] > -1) {
        markSpace = [0, 0];
    }
    let dims = ['x', 'y'];
    for(let dim of dims) {
        if($p.histograms.indexOf(vmap[dim]) !== -1) {
            let histMin = $p.intervals[vmap[dim]].min;
            let histMax = $p.intervals[vmap[dim]].max;
            let histIntv = $p.intervals[vmap[dim]].interval;
            let histBin = (histMax - histMin) / histIntv + 1;
            let d = (dim == 'x') ? 'domainX' : 'domainY';
            viewSetting.histogram[dim] = true;
            viewSetting[d] = new Array(histBin).fill(histMin).map((h, i) => h + i*histIntv);
            // markSpace[dims.indexOf(dim)] = 0.01;
        }
    }
    $p.uniform.uMarkSpace.data = markSpace;
    $p.uniform.uIsXYCategorical.data = isXYCategorical;

    // if(!$p._update) {
        if(!vmap.width && vmap.x) {
            $p.uniform.uDefaultWidth.data = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.x)]);
        } else if(vmapIndex[4] === -1 && typeof(vmap.width) == 'number') {
            $p.uniform.uDefaultWidth.data = vmap.width / width;
        }

        if(!vmap.height && vmap.y) {
            $p.uniform.uDefaultHeight.data = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.y)]);
        } else if(vmapIndex[5] === -1 && typeof(vmap.width) == 'number') {
            $p.uniform.uDefaultHeight.data = vmap.height / height;
        }
    // }
    return viewSetting;
}
