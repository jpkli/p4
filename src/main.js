import allocate  from './allocate';
import output    from './output';
import initialize    from './initialize';
import interact  from './interact';
import control from './control';
import pipeline from './pipeline';
import operate from './operate';
import kernels from './kernels';

export default function p4(options) {
    var $p = initialize(options);
    $p.views = [];
    $p.interactions = [];
    $p.responses = {};

    $p.deriveMax = options.deriveMax || 4;
    $p._responseType = 'unselected';
    $p._update = false;

    $p.getResult = function() {};
    let api = pipeline($p);
    api.ctx = $p;
    api.data = function(dataOptions) {
        allocate($p, dataOptions);
        $p.extent = kernels.extent($p);
        // $p.operations = compile($p);
        api.addModule(control);
        api.addModule(output);
        let operations = operate($p);
        for(let optName of Object.keys(operations)) {
            api.addOperation(optName, operations[optName])
        }
        api.register('__init__');
        return api;
    }

    api.view = function(views) {
        $p.views.forEach(function(v){
            if(v.hasOwnProperty('chart')) {
                v.chart.svg.remove();
                delete v.chart;
            }
            if(!v.hasOwnProperty('padding')) {
                v.padding = {left: 30, right: 30, top: 30, bottom: 30};
            }
        })
        $p.views = views;
        return api;
    }

    api.getResult = function (d) {
        return $p.getResult(d);
    }

    api.runSpec = function(specs) {
        api.head();
        api.clearViews();
        $p.interactions = [];
        $p.responses = {};
        $p.crossfilters = [];
        $p.uniform.uFilterFlag.data = 0;
        // $p.uniform.uFilterRanges = $p.fieldDomains.concat($p.deriveDomains);
        specs.forEach(function(spec){
            var opt = Object.keys(spec)[0],
                arg = spec[opt];

            opt = opt.slice(1);
            if(typeof api[opt] == 'function') {
                api[opt](arg);
            }
        })
        return api;
    }

    api.head = function() {
        api.resume('__init__');
        return api;
    }
  
    api.interact = function(spec) {
        if(typeof(spec) != 'undefined') $p.interactions.push(spec);
        $p.interactions.forEach(function(interaction){
            interact($p, {
                actions: interaction.event,
                view: interaction.from,
                condition: interaction.condition,
                callback: function(selection) {
                    $p.responses = interaction.response;
                    if(!$p._update) {
                        $p._update = true;
                        $p.crossfilters = {};
                        if(typeof selection == 'object') {
                            Object.keys(selection).forEach(function(k) {
                                if(selection[k].length < 2) {
                                    if($p.intervals.hasOwnProperty(k)) {
                                        var value = (Array.isArray(selection[k]))
                                            ? selection[k][0]
                                            : selection[k];
                                        selection[k] = [value-$p.intervals[k].interval, value];
                                    } else if(!$p.categoryLookup.hasOwnProperty(k)) {
                                        selection[k] = [selection[k][0] + selection[k][0] + 1];
                                    }
                                }
                                $p.crossfilters[k] = selection[k];
                            });
                        }
                        $p._responseType = 'unselected';
                        $p.uniform.uFilterLevel.data = 0.2;
                        $p.uniform.uVisLevel.data = 0.1;
                        api.head().run();
                        $p._responseType = 'selected';
                        $p.uniform.uVisLevel.data = 0.2;
                        api.head().match({}).run();
                        $p._responseType = 'unselected';
                        $p._update = false;
                        $p.uniform.uFilterLevel.data = 0.1;
                        $p.uniform.uVisLevel.data = 0.1;
                    }
                }
            })
        })
    }
    $p.respond = api.interact;

    api.updateData = function(newData) {
        api.head();
        for (let [ai, attr] of $p.fields.slice($p.indexes.length).entries()) {
            let buf = new Float32Array(newData[ai]);
            $p.texture.tData.update(
                buf, [0, $p.dataDimension[1] * ai], $p.dataDimension
            );
        }
        return api;
    }
    return api;
}
