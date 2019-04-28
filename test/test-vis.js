import p4 from '../';

export default function({
    data,
    schema,
    precision
}) {
    let db = p4.cstore();
    db.import({
        data: data,
        schema: schema
    });

    let config = {
        container: "p4",
        viewport: [800, 800]
    };

    let views = [
        {
            id: 'v1', width: 800, height: 400, 
            gridlines: {y: true},
            padding: {left: 70, right: 10, top: 50, bottom: 40},
            offset: [0, 0]
        },
        {
            id: 'v2', width: 800, height: 400, 
            gridlines: {y: true},
            padding: {left: 70, right: 10, top: 50, bottom: 40},
            offset: [0, 400]
        }
    ];

    let gpu = p4(config).data(db.data()).view(views);
    console.log(gpu)
    gpu.aggregate({
      $group: ['MotherAge'],
      $reduce: {
        count: {$count: '*'},
      }
    })
    .out('testing')
    .visualize({
      id: 'v1',
      mark: 'rect',
      x: 'MotherAge',
      height: 'count',
      color: 'teal'
    })

    gpu.aggregate({
      $group: ['MotherEdu'],
      $reduce: {
        count: {$count: '*'},
      },
      out: 'GroupByMEdu'
    })
    .visualize({
      id: 'v2',
      in: 'testing',
      mark: 'bar',
      x: 'MotherAge',
      height: 'count',
      color: 'teal'
    })

    // let sortMethod = (a,b) => a.count - b.count;
    // let gpuResult = gpu.runSpec(spec).result('row').sort(sortMethod);
    // console.log(gpuResult,)
}
