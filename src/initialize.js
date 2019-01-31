import FlexGL from '../flexgl';

export default function init({
    context = null,
    container = document.body,
    viewport =  [800, 450],
    padding = {left:0, right: 0,top: 0, bottom: 0},
    attributes = {},
    views
}){
    let $p = context;
    let defaultLayout = [
        {
            width: viewport[0],
            height: viewport[1],
            // padding: {left: 30, right: 30, top: 30, bottom: 30},
            offset: [0, 0]
        }
    ];
    if ($p === null) {
        $p = new FlexGL({
            container: container,
            width: viewport[0],
            height: viewport[1],
            padding: {left:0, right: 0,top: 0, bottom: 0},
            attributes: attributes
        });
    }
    $p.container = container;
    $p.padding = padding;
    $p.viewport = viewport;
    $p.views = views || defaultLayout;
    return $p;
}
