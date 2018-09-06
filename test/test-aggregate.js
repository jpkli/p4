import { assert } from 'chai';
import { validate } from './utils';
import cstore from '../src/cstore';
import p4 from '../src/pipeline';
import p3 from 'p.3';

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

    let config = {
        container: "p4",
        viewport: [800, 450]
    };

    let spec = [
        {
            $aggregate: {
                $group: ['MotherRace', 'Gender'],
                $reduce: {
                    sumWeight: {$sum: 'Weight'},
                    maxMotherWeight: {$max: 'MotherWeight'},
                    count: {$count: '*'},
                    // avergeAge: {$avg: 'MotherAge'},
                }
            }
        }
    ]

    let gpu = p4(config).data(db.data());
    let cpu = p3.pipeline(data);

    let c = data.filter(d=>d.MotherRace == 'Black' && d.Gender == 'F').map(d=>d.Weight).reduce((a,b) => a+b);

    describe('GPU-based aggregation', function() {
        
        describe('Group-by categorical attribute', function() {
            let gpuResult = gpu.runSpec(spec).result('row').sort((a,b)=> a.count-b.count);
            let cpuResult = cpu.runSpec(spec).sort((a,b)=> a.count-b.count);
            console.log(gpuResult, cpuResult)
            it('result size should equal ' + cpuResult.length, function() {
                assert.equal(gpuResult.length, cpuResult.length);
            });
        
            it('result should be closely equal with delta = ' + precision, function() {
                validate(cpuResult, gpuResult, precision);
            });
        
        });

    });

}
