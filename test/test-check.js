import cstore from '../src/cstore';
import p4 from '..';
// import spec from '../examples/scatter-plot.json';
// import spec from '../examples/cross-scatter.json';
// import spec from '../examples/parallel-coordinates.json';
import spec from '../examples/brush-link.json';
// import spec from '../examples/derive-match-group.json';
// import spec from '../examples/hoverbars.json';
// import spec from '../examples/bar-chart.json';

export default function({
    data,
    schema
}) {
    let db = cstore();
    db.import({
        data: data,
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

    gpu.runSpec(spec.operations);

    // gpu.annotate({
    //     id: 'c2',
    //     mark: 'vline',
    //     color: 'yellow',
    //     position: {values: [1000]}
    // })

    // let db2 = cstore({schema: schema});
    // db2.import({schema: schema, data: data.slice(100, 200)});
    // gpu.updateData(db2.data())
}
