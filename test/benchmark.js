define(function(require){
    const genData = require('./generate-data'),
        p4gl = require('../src/pipeline'),
        translate = require('../src/translate');

    return function(arg) {
        var options = arg || {},
            size = options.size || 100;

        var db = genData({
            size: 1000000,
            props: [
                {name: 'height', dtype: 'float', min: 100, max: 230, dist: 3},
                {name: 'weight', dtype: 'float', min: 70, max: 300},
                {name: 'iq', dtype: 'float', min: 0, max: 100},
                {name: 'age', dtype: 'int', min: 16, max: 99, dist: 1}
            ]
        });

        var data = db.data();
        data.stats = db.stats();

        var metadata = db.metadata();
        data.keys = metadata.attributes;

        // var test = p4gl({
        //     config: {padding: {left: 70, right: 10, top:10, bottom: 20}},
        //     width: 600,
        //     height: 600,
        //     // data: data,
        // });

        var start = new Date();

        // test
        // .data(data)
        // .select({
        //     age: [20, 50]
        // })
        // .aggregate({
        //     // $bin : 'age',
        //     $bin : {age: 10},
        //     avgw: {$count: 'age'}
        // })
        // .visualize({
        //     id: 'bar',
        //     mark: 'bar',
        //     x: 'age',
        //     y: 'avgw',
        //     // y: ['weight', 'height', 'age', 'iq'],
        //     // perceptual: 1
        // })

        translate({
            data: data,
            pipeline: [
                {
                    $select: { age: [20, 50] }
                },
                {
                    $aggregate : {
                        // $bin : 'age',
                        $bin : {age: 10},
                        avgw: {$count: 'age'}
                    }
                },
                {
                    $visualize: {
                        id: 'bar',
                        mark: 'bar',
                        x: 'age',
                        y: 'avgw',
                        // y: ['weight', 'height', 'age', 'iq'],
                        // perceptual: 1
                    }
                }
            ]
        })
    }
})
