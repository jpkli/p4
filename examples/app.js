requirejs.config({
    paths: {
        ace: ["//cdnjs.cloudflare.com/ajax/libs/ace/1.2.6"],
        flexgl: 'flexgl/src'
     }
})

define(function(require){
    const ace = require('ace/ace');
    const P4GL = require('../../src/pipeline');
    const ajax = require('../../src/ajax');
    const genData = require('benchmark/src/gen-binary');
    const parse = require('../../src/parse');
    const cstore = require('../../src/cstore');

    return function() {
        var program;
        var pageHeight = $('.column').height() - $('#page-header').height() * 2;
        $('.column').css('height', pageHeight);
        $('#editor').css('height', pageHeight);

        ace.config.set("packaged", true);
        ace.config.set("basePath", require.toUrl("ace"));
        var editor = ace.edit("editor");
        editor.setTheme("ace/theme/chrome");
        editor.getSession().setMode("ace/mode/json");

        editor.setOptions({
            fontSize: "12pt"
        });
        editor.$blockScrolling = Infinity;

        var dataProps = [
            {name: 'height', dtype: 'float', dist: 'normal', min: 50, max: 90, mean: 70, std: 10},
            {name: 'weight', dtype: 'float', dist: 'normal', min: 60, max: 300, mean: 150, std: 50},
            {name: 'iq', dtype: 'int', dist: 'normal', min: 10, max: 200, mean: 110, std: 80},
            {name: 'age', dtype: 'int', dist: 'normal', min: 16, max: 85, mean: 50, std:20},
            {name: 'race', dtype: 'string', values: ['Native', 'Asian', 'Black', 'White', 'Hispanic',  'Other', 'Two or More']}
        ];

        ajax.get({
            url: 'data/Nat2015result-200k.csv',
            dataType: 'text'
        }).then(function(text){
            var rows = parse(text, ','),
                header = rows.shift();

            var schema = header.reduce(function(obj,value){
                var vals = value.split(':');
                obj[vals[0]] =vals[1];
                return obj;
            }, {});

            var db = cstore({
                size: rows.length,
                struct: schema
            });
            db.addRows(rows);

            var data = db.data();
            data.stats = db.stats();
            var metadata = db.metadata();
            data.keys = metadata.attributes;
            data.size = metadata.size;
            data.CAMs = metadata.CAMs;
            data.TLBs = metadata.TLBs;
            data.dtypes = metadata.types;
            console.log(metadata);
            var dsl = {
                container: "main-vis",
                viewport: [800, 450],
                // padding: {left: 50, right: 40, top: 40, bottom: 40},
                data: data
            };

            program = P4GL(dsl);
            $.getJSON('examples/examples.json', function(examples){
                examples.forEach(function(ex, ei){
                    var div = $('<div/>').addClass('sidebar-module'),
                        h4 = $('<h4/>').text(ex.category),
                        ul = $('<ul/>').addClass('list-unstyled example-list');

                        if(ex.hasOwnProperty('views')) {
                            program.view(ex.views);
                        }
                    ex.examples.forEach(function(item, ii){


                        var itemLink = $('<a/>').attr('href', '#').text(item.name);
                        ul.append($('<li/>').append(itemLink));
                        itemLink.click(function(){
                            editor.setValue("");
                            $('.example-list .active').removeClass('active');
                            $(this).addClass('active');
                            $.ajax({
                                url: 'examples/' + item.file,
                                dataType: 'text',
                            })
                            .done(function(json){
                                var spec = JSON.parse(json);
                                if(spec.hasOwnProperty('views')) {
                                    program.view(spec.views);
                                } else if(ex.hasOwnProperty('views')) {
                                    program.view(ex.views);
                                }
                                editor.session.insert({row:0, column: 0}, json);
                                program.runSpec(spec.operations || spec.pipeline);
                            })
                        })

                        if(ei === 0 && ii === 0) {
                            itemLink.addClass('active');

                        }
                    })

                    div.append(h4);
                    div.append(ul);
                    $('#list-examples').append(div);
                })
                $('.example-list .active').trigger('click');
            })


        })

        // var data = genData({
        //     size: 100000,
        //     props: dataProps
        // });
        //
        //
        // var dsl = {
        //     container: "main-vis",
        //     viewport: [800, 560],
        //     padding: {left: 80, right: 80, top: 30, bottom: 100},
        //     data: data
        // };




        $('#run-spec').click(function(){
            var spec = JSON.parse(editor.getValue());
            if(spec.hasOwnProperty('views')) program.view(spec.views);
            program.runSpec(spec.operations || spec.pipeline);

        })
    };

})
