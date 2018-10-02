import cstore from '../src/cstore';
import p4 from '..';
// import spec from '../examples/cross-scatter.json';
// import spec from '../examples/parallel-coordinates.json';
import spec from '../examples/brush-link.json';
// import spec from '../examples/derive-match-group.json';
// import spec from '../examples/heatmap.json';

export default function({
    data,
    schema,
    precision
}) {
    let db = cstore();
    db.import({
        data: data,
        schema: schema
    });

    let db2 = cstore();
    db2.import({
        data: data.slice(100, 200),
        schema: schema
    });

    let config = {
        container: "p4",
        viewport: [800, 450]
    };

    let defaultViews = [
        {id: 'test', width: 500, height: 300, padding: {left: 70, right: 10, top: 50, bottom: 60}}
    ];

    let gpu = p4(config).data(db.data());

    if(spec.hasOwnProperty('views')) {
        gpu.view(spec.views);
    } else {
        gpu.view(defaultViews);
    }
   
    gpu.runSpec(spec.operations)

    // gpu.updateData(db2.data())
}
