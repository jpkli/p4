define(function(require){
    const FlexGL = require('flexgl/flexgl');

    return function(options) {
        var $p = options.context || null,
            container = options.container || document.body,
            viewport = options.viewport || [800, 450],
            padding = options.padding || {left: 60, right: 20,top: 20, bottom: 50};

        var defaultLayout = [
            {
                width: viewport[0],
                height: viewport[1],
                padding: padding,
                offset: [0, 0]
            }
        ];

        if ($p === null) {
            $p = new FlexGL({
                container: container,
                width: viewport[0] - padding.left - padding.right,
                height: viewport[1] - padding.top - padding.bottom,
                padding: padding
            });
            $p.container = container;
            $p.padding = padding;
            $p.viewport = viewport;
        }

        $p.container = container;
        $p.views = options.views || defaultLayout;

        $p.deriveMax = options.deriveMax || 4;

        $p.interaction = options.interaction || 'auto';

        return $p;
    }
})
