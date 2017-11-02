requirejs.config({
    paths: {
        ace: ["//cdnjs.cloudflare.com/ajax/libs/ace/1.2.6"]
     }
})
require(['ace/ace', '../../src/pipeline', 'benchmark/src/gen-binary'], function(ace, P4GL, genData) {

    var pageHeight = $('.column').height() - $('#page-header').height() * 2;
    $('.column').css('height', pageHeight);
    $('#editor').css('height', pageHeight);

    ace.config.set("packaged", true)
    ace.config.set("basePath", require.toUrl("ace"))
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


    var data = genData({
        size: 100000,
        props: dataProps
    });
    var dsl = {
        container: "main-vis",
        viewport: [800, 560],
        padding: {left: 80, right: 80, top: 30, bottom: 100},
        data: data
    };

    var program = P4GL(dsl);

    var currentExample;

    $.getJSON('examples/examples.json', function(examples){
        currentExample = examples[0];
        examples.forEach(function(ex){
            var div = $('<div/>').addClass('sidebar-module'),
                h4 = $('<h4/>').text(ex.category),
                ul = $('<ul/>').addClass('list-unstyled example-list');


            ex.examples.forEach(function(item){
                var itemLink = $('<a/>').attr('href', '#').text(item.name);
                ul.append($('<li/>').append(itemLink));
                itemLink.click(function(){
                    editor.setValue("");

                    $.ajax({
                        url: 'examples/' + item.file,
                        dataType: 'text',
                    })
                    .done(function(spec){
                        editor.session.insert({row:0, column: 0}, spec);

                        program.runSpec(JSON.parse(spec).pipeline);
                    })
                })
            })

            div.append(h4);
            div.append(ul);
            $('#list-examples').append(div);
        })
    })

    $('#run-spec').click(function(){
        program.runSpec(JSON.parse(editor.getValue()).pipeline);

    })


})
