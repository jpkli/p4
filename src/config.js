define(function(require){
    const FlexGL = require('flexgl/src/flexgl');
    return function(options) {
        var container   = options.container || document.body,
            context     = options.context || null,
            viewport    = options.viewport || [800, 450],
            padding     = options.padding || {left: 60, right: 20,top: 20, bottom: 50};

        var defaultView = {
            width: viewport[0],
            height: viewport[1],
            offset: [0, 0]
        };

        if (context === null) {
            context = new FlexGL({
                container: container,
                width: viewport[0] - padding.left - padding.right,
                height: viewport[1] - padding.top - padding.bottom,
                padding: padding
            });
            context.container = container;
            context.padding = padding;
            context.viewport = viewport;
        }

        context.container = container;
        context.views =  options.views || [defaultView];
        context.viewID = 0;
        context.viewNames = [];

        context.deriveMax = options.deriveMax || 4;

        context.interaction = options.interaction || 'auto';

        return context;
    }
})
