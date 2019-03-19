import { assert } from 'chai';
import { validate } from './utils';
import cstore from '../src/cstore';
import p4 from '..';

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

    // let cpuData = db.export();
   
    let config = {
        container: "p4",
        viewport: [800, 450]
    };

    let gpuData = p4(config)
        .data(db.data())
        .cache('initData')
        .result('row')

    console.log(gpuData)

    // describe('Cache data in system memory', function() {
    
    //     it('cached data size should equal ' + data.length, function() {
    //         assert.equal(cpuData.length, data.length);
    //     });
    
    //     it('result should be closely equal with delta = ' + precision, function() {
    //         validate(data, cpuData, precision);
    //     });
    
    // });

    describe('Cache data in GPU memory', function() {
    
        it('cached data size should equal ' + data.length, function() {
            assert.equal(gpuData.length, data.length);
        });
    
        it('result should be closely equal with delta = ' + precision, function() {
            validate(data[0], gpuData[0], precision);
        });
    
    });

}
