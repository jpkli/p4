define(function(require) {
    // dependencies
    var pipeline = require('../src/pipeline'),
        format = require('i2v/format');

    // UI modules
    var ace = require('ace/ace'),
        Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button'),
        ProgressBar = require('vastui/progress');

    var fileLoader = require('./fileloader'),
        adav = require('../src/adav');

    var appLayout = new Layout({
        margin: 5,
        cols: [
            {
                width: 0.45,
                id: 'editorView'
            },
            {
                width: 0.55,
                id: 'visView',
            },
        ]
    });

    var views = {};

    views.editor = new Panel({
        container: appLayout.cell('editorView'),
        id: "editor",
        title: "P4 Specification",
        header: {height: 50, style: {backgroundColor: '#F4F4F4'}}
    });

    views.vis= new Panel({
        container: appLayout.cell('visView'),
        id: "panel-vis",
        title: "Visualization",
        header: {height: 50, style: {backgroundColor: '#F4F4F4'}}
    });

    var specTemplate = {
        data: {},
        transform: [
            {$visualize: {}}
        ]
    };

    ace.config.set("packaged", true)
    ace.config.set("basePath", require.toUrl("ace"))
    var editor = ace.edit("editor-body");
    editor.setTheme("ace/theme/clouds");
    editor.getSession().setMode("ace/mode/json");

    editor.setOptions({
      fontSize: "12pt"
    });

    // editor.session.insert({row:0, column: 0}, JSON.stringify(specTemplate, null, 2));

    var p = pipeline({container: views.vis.body});
    p.init(specTemplate);

    var fileUploadButton = new Button({
        label: 'Select File',
        types: ['teal', 'xs'],
        size: '0.65em',
        fileInput: {id: 'testFileUpload', onchange: function(file) {fileUploadButton.toggleLoading(); loadDataFromFile(file[0]); }},
    });

    var uploadDataButton = new Button({
        id: "testingUpload",
        label: 'Load Data to GPU',
        types: ['orange', 'xs'],
        size: '0.65em',
        onclick: function() {
            console.log('upload data to GPU');
            uploadDataButton.toggleLoading();
        }
    });

    var runPipeline = new Button({
        label: ' Run ',
        types: ['primary', 'xs'],
        size: '0.65em',
        onclick: function() {
            // console.log(editor.getValue().slice(11));
            p.exec(JSON.parse(editor.getValue()), true);
        }
    });
    views.editor.header.append(fileUploadButton);
    views.editor.header.append(uploadDataButton);
    views.editor.header.append(runPipeline);

    var dataStore,
        delimiter;

    function loadDataFromFile(file) {
        fileLoader({
            file: file,
            // skip: 1,
            onstart: function(meta) {
                fileUploadButton.toggleLoading();
                var firstRow = meta.first;
                var delimiters = [',', ' ', ':', ';'],
                    dcount = new Array(delimiters.count);

                for(var i = 0; i < delimiters.length; i++) {
                    var re = new RegExp(delimiters[i], 'g');
                    var find = firstRow.match(re);
                    dcount[i] = find.length;
                    if(find.length) break;
                }

                var dmi = Math.max.apply(null, dcount);

                delimiter = delimiters[dcount.indexOf(dmi)];
                console.log(dmi, delimiter);

                var fields = meta.header.split(delimiter),
                    values = firstRow.split(delimiter),
                    dtypes = new Array(fields.length);

                values.forEach(function(v, i) {

                    if(parseFloat(v) == v) {
                        dtypes[i] = (v.match(/\./))  ? 'float' : 'int';
                    } else {
                        dtypes[i] = 'string';
                    }
                })

                var struct = {};
                fields.forEach(function(f, i){
                    struct[f] = dtypes[i];
                });

                specTemplate.data.protocol = 'file';
                specTemplate.data.path = './' + file.name;
                specTemplate.data.attributes = struct;
                editor.session.insert({row:0, column: 0}, JSON.stringify(specTemplate, null, 2));

                dataStore({
                    size: meta.line,
                    struct: struct
                });
            },
            onload:function (data) {

                // console.log(data.length, data[0]);
            },
            oncomplete: function() {
                // progress.label( rowTotal + ' data items loaded from ' + file.name);
            }
        });

    }

    // var progress = new ProgressBar({
    //     percentage: 0,
    //     types: ['green']
    // });
    //
    // appLayout.cell('pageHeader').append(progress);
    // fileUploadButton.style.float = 'left';
    // fileUploadButton.style.padding = '12px';
    //
    // progress.style.top = '5px';
    // progress.style.marginLeft = fileUploadButton.clientWidth + 10 + 'px';
    // progress.style.marginRight ='10px';
    // progress.hide();

    return function(){};

});
