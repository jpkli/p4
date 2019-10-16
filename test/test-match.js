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
            offset: [0, 0]
        }
    ];

    let matchNumeric = [
        {
            $match: {
                MotherAge: [33, 35],
                FatherAge: [35, 38],
                MotherWeight: [160, 200]
            }
        }
    ]

    let matchCategorical = [
        {
            $match: {
                FatherEdu: {$in: ['Master']},
                FatherRace: {$in: ['Asian']},
                MotherRace: {$in: ['White']},
                MotherEdu: {$in: ['Master', 'Doctorate']},
            }
        }
    ]

    let matchMix = [
        {
            $match: {
                MotherAge: [33, 35],
                FatherAge: [35, 38],
                FatherEdu: {$in: ['Master']},
                MotherEdu: {$in: ['Master']},
            }
        }
    ]

    let gpu = p4(config).data(db.data()).view(views);
    let cpu = p3.pipeline(data);
    let sortMethod = (a,b)=> a.MotherWeight - b.MotherWeight; //sort for comparing results
    
    describe('Match', function() {
        
        describe('Match integer attributes', function() {
            let gpuResult = gpu.runSpec(matchNumeric).toJson().sort(sortMethod);
            let cpuResult = cpu.runSpec(matchNumeric).sort(sortMethod);
            console.log(gpuResult);
            console.log(cpuResult);
            it('result size should equal ' + cpuResult.length, function() {
                assert.equal(gpuResult.length, cpuResult.length);
            });
        
            it('result should be closely equal with delta = ' + precision, function() {
                validate(cpuResult, gpuResult, precision);
            });
        });

        describe('Match categorical attributes', function() {
            cpu = p3.pipeline(data);
            let gpuResult = gpu.runSpec(matchCategorical).toJson().sort(sortMethod);
            let cpuResult = cpu.runSpec(matchCategorical).sort(sortMethod);
            console.log(gpuResult);
            console.log(cpuResult);
            it('result size should equal ' + cpuResult.length, function() {
                assert.equal(gpuResult.length, cpuResult.length);
            });
        
            it('result should be closely equal with delta = ' + precision, function() {
                validate(cpuResult, gpuResult, precision);
            });
        });

        describe('Match mixed attributes', function() {
            cpu = p3.pipeline(data);
            let gpuResult = gpu.runSpec(matchMix).toJson().sort(sortMethod);
            let cpuResult = cpu.runSpec(matchMix).sort(sortMethod);
            console.log(gpuResult);
            console.log(cpuResult);
            it('result size should equal ' + cpuResult.length, function() {
                assert.equal(gpuResult.length, cpuResult.length);
            });
        
            it('result should be closely equal with delta = ' + precision, function() {
                validate(cpuResult, gpuResult, precision);
            });
        });

    });

}
