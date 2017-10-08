define(function(require){
    const genData = require('./generate-data'),
        p4gl = require('../src/pipeline'),
        translate = require('../src/translate');

    return function(arg) {
        var options = arg || {},
            size = options.size || 100;

        var db = genData({
            size: 100000,
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
        data.size = metadata.size;


        var start = new Date();

        translate({
            config: {
                viewport: [800, 400],
                views: [
                    {width: 380, height: 400, offset: [0, 0]},
                    {width: 380, height: 400, offset: [440, 0]},
                ]
            },
            data: data,
            pipeline: [
                {
                    $select: { age:  [20,70] }
                },

                {
                    $aggregate : {
                        // $group : 'age',
                        $bin : {age: 10},
                        count: {$count: 'age'}
                    }
                },
                {
                    $visualize: {
                        id: 'bb',
                        mark: 'bar',
                        x: 'age',
                        y: 'count',
                        // y: ['weight', 'height', 'age', 'iq'],
                        // perceptual: 1
                    }
                },

                { $head: 'testing'},
                {
                    $select: { age: [20, 35] }
                },
                // {
                //     $aggregate : {
                //         $group : 'age',
                //         // $bin : {age: 5},
                //         avgw: {$avg: 'age'}
                //     }
                // },
                {
                    $visualize: {
                        id: 'test',
                        mark: 'dot',
                        x: 'weight',
                        y: 'height',
                        alpha: 0.2
                        // y: ['weight', 'height', 'age', 'iq'],
                        // perceptual: 1
                    }
                },
            ]
        })
    }
})
