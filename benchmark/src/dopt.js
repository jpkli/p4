const dataSizeTable = {
    "14": '16K',
    "15": '32K',
    "16": '64K',
    "17": '128K',
    "18": '256K',
    "19": '512K',
    "20": '1M',
    "21": '2M',
    "22": '4M',
    "23": '8M',
    "24": '16M',
}

const maxSize = {
    d3: {
        select: 20,
        derive: 22,
        aggregate: 22
    },
    vega: {
        select: 22,
        derive: 22,
        aggregate: 22
    },
    lodash: {
        select: 22,
        derive: 22,
        aggregate: 22
    },
    p4gl: {
        select: 24,
        derive: 24,
        aggregate: 24
    }
}

var dataProps = [
    {name: 'height', dtype: 'float', dist: 'normal', min: 50, max: 90, mean: 70, std: 10},
    {name: 'weight', dtype: 'float', dist: 'normal', min: 60, max: 300, mean: 150, std: 50},
    {name: 'iq', dtype: 'float', dist: 'normal', min: 10, max: 200, mean: 110, std: 30},
    {name: 'age', dtype: 'int', dist: 'normal', min: 16, max: 99, mean: 50, std:25}
];

var results = [];
function listResults(dataSize, libs, dopts) {
    var table = $('<table/>').addClass('table table-bordered').attr('id', 'result'+dataSize),
        thead = $('<thead/>'),
        tbody = $('<tbody/>');

    var thr = $('<tr/>');
    thr.append($('<th/>').css('width', 100).text('Data size = ' + dataSizeTable[dataSize]));
    dopts.forEach(function(dopt){
        thr.append($('<th/>').css('width', 100).text(dopt))
    })

    libs.forEach(function(lib){
        var tr = $('<tr/>').attr('id', lib + '-' + dataSize);
        tr.append(
            $('<th/>').text(lib)
        );
        dopts.forEach(function(dopt){

            tr.append(
                $('<td/>').attr('id', lib + '-' + 'dopt').text(' ')
            );
        })
        tbody.append(tr);
    });

    thead.append(thr);

    table.append(thead);
    table.append(tbody);
    $('#benchmark-results').append(table);
    return table;
}

require(['src/dataopts', 'src/result-plot'], function(benchmark, plotResults) {

    $('#dataProps').val(dataProps.map(d => JSON.stringify(d)).join(',\n').replace(/,/g, ', ').replace(/:/g, ': '));

    var startBenchmark = false;
    var dataSizes = [], libs = [], dopts = [];
    $('#start-benchmark').on('click', function(d) {
        if(startBenchmark) return;
        else startBenchmark = true;

        var benchmarkStartTime = performance.now();
        this.className = 'btn btn-warning disabled';
        $(this).text('Running Benchmarks ...')


        $('#sel-data-sizes :input[type=checkbox]:checked').each(function() {
            dataSizes.push(parseInt($(this).val()));
        })
        $('#sel-operations :input[type=checkbox]:checked').each(function() {
            dopts.push($(this).val());
        })
        $('#sel-libs :input[type=checkbox]:checked').each(function() {
            libs.push($(this).val());
        })


        var controls = {},
            thresholdLatency = parseInt($('#latency-max').val()) * 1000;

        libs.forEach(function(lib){
            controls[lib] = {skip: false};
            dopts.forEach(function(dopt){
                controls[lib][dopt] = true;
            })
        })

        dataSizes.forEach(function(dataSize){
            var li = $('<li/>').append($('<a/>').attr('href', '#'+dataSize).text(dataSizeTable[dataSize]));
            $('#benchmark-result-tabs').append(li);
        })

        $("#benchmark-result-tabs > li").first().addClass('active');
        $("#benchmark-result-tabs > li > a").click(function(d){
            $("#benchmark-result-tabs > li").each(function(d){
                $(this).removeClass('active');
            })
            $(this).parent().addClass('active');
            var ds = $(this).attr('href').slice(1);
            $('.table-bordered').each(function(){$(this).hide()})

            $('#result'+ds).show();
        })


        console.log(dataSizes, libs, dopts);
        dataSizes.forEach(function(dataSize) {
            listResults(dataSize, libs, dopts);
        })
        $('.table-bordered').each(function(){$(this).hide()})

        function showResultTable(ti) {
            $('.table-bordered').each(function(){$(this).hide()});
            $('.table-bordered').eq(ti).show();
        }
        // showResultTable(0);


        var di = 0, dataSize = dataSizes[di];
        function runTest() {
            $("#benchmark-result-tabs > li").each(function(d){
                $(this).removeClass('active');
            })
            $("#benchmark-result-tabs > li").eq(di).addClass('active');
            showResultTable(di);
            console.log('benchmark data size: ',  dataSize, performance.now()- benchmarkStartTime);

            libs.forEach(function(lib){
                dopts.forEach(function(dopt){
                    if(dataSize > maxSize[lib][dopt]) {
                        controls[lib][dopt] = false;
                    }
                });
            })

            var rrr = benchmark({
                libs: libs,
                dopts: dopts,
                controls: controls,
                trials: parseInt($('#trials').val()),
                dataSize: Math.pow(2, dataSize),
                oncomplete: function(l, res) {
                    $('#' + l + '-' + dataSize + ' > td').each(function(tdi){
                        $(this).text(res[dopts[tdi]].avg.toFixed(2));
                        if(res[dopts[tdi]].avg > 0) {
                            results.push({
                                dataSize: dataSizeTable[dataSize],
                                lib: l,
                                dopt: dopts[tdi],
                                latency: res[dopts[tdi]].avg,
                            })
                        }

                        if(res[dopts[tdi]].avg > thresholdLatency) {
                            controls[l][dopts[tdi]] = false;
                        }
                    })
                }
            });
            // libs.forEach(function(lib){
            //     dopts.forEach(function(dopt){
            //         results.push({
            //             dataSize: dataSizeTable[dataSize],
            //             lib: lib,
            //             dopt: dopt,
            //             latency: rrr[lib][dopt].avg,
            //         })
            //     })
            // })

            if(di == dataSizes.length - 1) {
                $('#start-benchmark').hide();
                $('#save-result').show();
                console.log(results);
                dopts.forEach(function(dopt, pi){
                    $('#result-'+dopt).append($('<h4/>').text(dopt));
                    var plotOptions = {
                        data: results.filter(d => d.dopt == dopt),
                        container: '#result-' + dopt,
                        dopt: dopt,
                        libs: libs,
                        width: 280,
                        height: 280,
                        dataSizes: dataSizes.map(d => dataSizeTable[d])
                    };

                    if(pi == dopts.length - 1) {
                        plotOptions.margin = {top: 30, right: 80, bottom: 60, left: 40};
                        plotOptions.legend = true;
                    }

                    plotResults(plotOptions);
                })

            } else {
                di++;
                dataSize = dataSizes[di];
                // setTimeout(runTest, 1000 + (dataSize - 14) * 500 * parseInt($('#trials').val()) * libs.length);
                setTimeout(runTest, 1000 * libs.length);
            }
        }
        setTimeout(runTest, 1000);


    })

    var resultJSON = [];

    function download(text, name, type) {
        var a = document.createElement("a");
        var file = new Blob([text], {type: type});
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
    }
    // var savedResults = [];
    // ['d3', 'vega', 'lodash', 'p4gl'].forEach(function(lib){
    //      savedResults = savedResults.concat( JSON.parse(localStorage.getItem('benchmark-'+lib+'-results'))
    //  );
    //
    // })     ;
    // download(JSON.stringify( savedResults ), 'results.json', 'text/plain');

    $('#save-result').click(function(){
        libs.forEach(function(lib){
            var newResults = results.filter((d) => d.lib == lib);
            var savedResults = JSON.parse(localStorage.getItem('benchmark-'+lib+'-results'));
            if(savedResults !== null) {
                var items = Object.keys(newResults);
                items.forEach(function(item){
                    savedResults[item] = newResults[item];
                })
                localStorage.setItem('benchmark-'+lib+'-results', JSON.stringify(savedResults));
            } else {
                localStorage.setItem('benchmark-'+lib+'-results', JSON.stringify(newResults));
            }
        });
        download(JSON.stringify(results).replace(/\},/g, '},\n' ), 'results.json', 'text/plain');
    })

});
