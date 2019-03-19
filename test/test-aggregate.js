import { assert } from 'chai';
import { validate } from './utils';
import p4 from '../';
import p3 from 'p3';

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
        viewport: [800, 450]
    };

    let views = [
        {
            id: 'v1', width: 800, height: 400, 
            gridlines: {y: true},
            padding: {left: 70, right: 10, top: 50, bottom: 40},
            offset: [0, 0],
            // color: {
                // range: ['red', 'blue', 'green', 'purple'],
                // interpolate: false
            // }
        }
    ];

    let spec = [
        {
            $aggregate: {
                // $group: ['MotherAge', 'FatherAge'],
                $group: ['MotherAge'],
                $reduce: {
                    maxMotherWeight: {$max: 'MotherWeight'},
                    sumWeight: {$sum: 'BabyWeight'},
                    minMotherWeight: {$min: 'MotherWeight'},
                    maxMotherWeight: {$max: 'MotherWeight'},
                    averageAge: {$avg: 'MotherAge'},
                    count: {$count: '*'},
                    // avergeWeight: {$avg: 'MotherWeight'},
                }
            }
        },
        // {
        //     $aggregate: {
        //         $group: ['MotherAge'],
        //         $reduce: {
        //             avgValue: {$sum: 'count'}
        //         }
        //     }
        // },
        // {
        //     $match: {
        //         avgValue: [2800, 50000]
        //     }
        // }
    ]



    let gpu = p4(config).data(db.data()).view(views);
    // let gpuResult = gpu.runSpec(spec).result('row');
    // console.log(gpuResult);

    let cpu = p3.pipeline(data);
    
    describe('GPU-based aggregation', function() {
        
        describe('Group-by categorical attribute', function() {
            let sortMethod = (a,b)=> a.MotherAge - b.MotherAge;
            let gpuResult = gpu.runSpec(spec).result('row').sort(sortMethod);
            let cpuResult = cpu.runSpec(spec).sort(sortMethod);
            console.log(gpuResult);
            console.log(cpuResult);
            it('result size should equal ' + cpuResult.length, function() {
                assert.equal(gpuResult.length, cpuResult.length);
            });
        
            it('result should be closely equal with delta = ' + precision, function() {
                validate(cpuResult, gpuResult, precision);
            });
        
        });

        // describe('Group-by categorical attribute', function() {
        //     let gpuResult = gpu.head().runSpec(specBinning).result('row');
        //     // console.log(gpuResult)
        // });

    });

}
