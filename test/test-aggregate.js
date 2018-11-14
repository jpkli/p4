import { assert } from 'chai';
import { validate } from './utils';
import cstore from '../src/cstore';
import p4 from '../';
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
                $group: ['MotherRace'],
                $reduce: {
                    avergeAge: {$avg: 'MotherAge'},
                    sumWeight: {$sum: 'BabyWeight'},
                    maxMotherWeight: {$max: 'MotherWeight'},
                    avergeHeight: {$avg: 'MotherHeight'},
                    count: {$count: '*'},
                    avergeWeight: {$avg: 'MotherWeight'},
                }
            }
        }
    ]

    let gpu = p4(config).data(db.data());
    let cpu = p3.pipeline(data);
    
    describe('GPU-based aggregation', function() {
        
        describe('Group-by categorical attribute', function() {
            let sortMethod = (a,b)=> a.count - b.count;
            let gpuResult = gpu.runSpec(spec).result('row').sort(sortMethod);
            let cpuResult = cpu.runSpec(spec).sort(sortMethod);
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
