define(function(require){
    const visualEncodings = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size'];

    return function ($p, vmap, colorManager) {
        var opacity = vmap.opacity || vmap.alpha;
        var vmapIndex = new Int32Array(visualEncodings.length);
        visualEncodings.forEach(function(code, codeIndex){
            vmapIndex[codeIndex] = $p.fields.indexOf(vmap[code]);
        })
        $p.uniform.uVisualEncodings = vmapIndex;
        $p.uniform.uDefaultAlpha = 1.0;
        if(vmapIndex[2] === -1) {
            if (typeof(vmap.color) === 'string'){
                if(vmap.color === 'auto') {
                    $p.revealDensity = true;
                    $p.uniform.uRevealMode.data = 1;
                } else {
                    $p.uniform.uDefaultColor = colorManager.rgb(vmap.color);
                }
            } else {
                if(typeof(vmap.size) == 'number') {
                    $p.uniform.uMarkSize = vmap.size;
                }
            }
        }

        if(typeof(opacity) === 'number') {
            $p.uniform.uDefaultAlpha = opacity;
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
        } else if(vmap.mark && vmap.mark == 'rect') {
            $p.renderMode = 'polygon';
        }

        if(vmapIndex[6] === -1 && typeof(vmap.size) == 'number') {
            $p.uniform.uMarkSize = vmap.size;
        }

        if(!$p._update) {
            if(!vmap.width && vmap.x) {
                $p.uniform.uDefaultWidth = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.x)] );
            } else if(vmapIndex[4] === -1 && typeof(vmap.width) == 'number') {
                $p.uniform.uDefaultWidth = vmap.width / width;
            }

            if(!vmap.height && vmap.y) {
                $p.uniform.uDefaultHeight = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.y)] );
            } else if(vmapIndex[5] === -1 && typeof(vmap.width) == 'number') {
                $p.uniform.uDefaultHeight = vmap.height / height;
            }
        }

        return vmapIndex;
    }
});
