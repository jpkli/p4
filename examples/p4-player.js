var program, rows, header, schema, views;
var pageHeight = $('.column').height() - $('#page-header').height() * 2;
$('.column').css('height', pageHeight);
$('#editor').css('height', pageHeight);

ace.config.set("packaged", true);
var editor = ace.edit("editor");
editor.setTheme("ace/theme/chrome");
editor.getSession().setMode("ace/mode/json");

editor.setOptions({
    fontSize: "12pt"
});
editor.$blockScrolling = Infinity;

function loadData() {
    $('#main-vis').html('');

    var dataSize = parseInt($('#data-size').val());
    var size = (dataSize <= rows.length) ? dataSize : rows.length;

    var db = p4.cstore({
        size: size,
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
    // console.log(metadata);
    var dsl = {
        container: "main-vis",
        viewport: [800, 450],
        data: data
    };
    program = p4(dsl);
}

function execute() {
    var spec = JSON.parse(editor.getValue());
    if(spec.hasOwnProperty('views')) program.view(spec.views);
    else program.view(views);
    program.runSpec(spec.operations || spec.pipeline);
}


$('#data-size').on('change', function(){
    loadData();
    execute();
})

p4.ajax.get({
    url: 'https://jpkli.github.io/vis-examples/data/NatUSA/Nat2015result-200k.csv',
    dataType: 'text'
}).then(function(text){
    rows = p4.parse(text, ',');
    header = rows.shift();

    schema = header.reduce(function(obj,value){
        var vals = value.split(':');
        obj[vals[0]] =vals[1];
        return obj;
    }, {});

    var selectedExample = window.location.href.split("#")[1] || null;

    loadData();

    $.getJSON('examples.json', function(examples){
        examples.forEach(function(ex, ei){
            var div = $('<div/>').addClass('sidebar-module'),
                // h4 = $('<h5/>').text(ex.category),
                ul = $('<ul/>').addClass('list-unstyled example-list');

                if(ex.hasOwnProperty('views')) {
                    views = ex.views;
                    program.view(ex.views);
                }
            ex.examples.forEach(function(item, ii){
                var itemTag = item.file.split('.')[0];
                var itemLink = $('<a/>').attr('href', '#'+itemTag).text(item.name);
                ul.append($('<li/>').append(itemLink));
                itemLink.click(function(){
                    editor.setValue("");
                    $('.example-list .active').removeClass('active');
                    $(this).addClass('active');
                    $.ajax({
                        url: item.file,
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
                        editor.getSession().foldAll(2, 17);
                    })
                })

                if(selectedExample !== null) {
                    if(selectedExample == itemTag) {
                        itemLink.addClass('active');
                    }
                } else if(ei === 0 && ii === 0) {
                    itemLink.addClass('active');
                }
            })

            // div.append(h4);
            div.append(ul);
            $('#list-examples').append(div);
        })
        $('.example-list .active').trigger('click');
    })
})

$('#run-spec').click(function(){
    execute();
})
