import FlexGL from '../flexgl';

export default function init(options) {
    var $p = options.context || null,
        container = options.container || document.body,
        viewport = options.viewport || [800, 450],
        padding = {left:0, right: 0,top: 0, bottom: 0},
        glAttr = options.attributes || {};

    var defaultLayout = [
        {
            width: viewport[0],
            height: viewport[1],
            padding: {left: 30, right: 30, top: 30, bottom: 30},
            offset: [0, 0]
        }
    ];
    if ($p === null) {
        $p = new FlexGL({
            container: container,
            width: viewport[0],
            height: viewport[1],
            padding: padding,
            attributes: glAttr
        });
        $p.padding = padding;
        $p.viewport = viewport;
    }
    $p.container = container;
    $p.views = options.views || defaultLayout;
    return $p;
}
