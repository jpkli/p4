import allocate from './allocate';
import input from './io/input';
import output from './io/output';
import initialize from './initialize';
import interact from './interact';
import control from './control';
import pipeline from './pipeline';
import operate from './operate';
import kernels from './kernels';
import extensions from './extensions';
import Grid from './grid';
import cstore from './cstore';

export default function p4(options) {
  let $p = initialize(options);
  $p.async = options.async || false;
  $p.views = [];
  $p.interactions = [];
  $p.histograms = [];
  $p.extensions = extensions;
  $p.responses = {};
  $p.crossfilters = {};
  $p.primitives = [];
  $p.dataSize = 0;
  $p.rowSize = options.dimX || 4096;
  $p.deriveMax = options.deriveMax || 4;
  $p.deriveCount = 0;
  
  $p._responseType = 'unselected';
  $p._update = false;
  $p._progress = false;
  $p.skipRender= false;

  $p.getResult = function() {};
  let api = pipeline($p);
  api.ctx = $p;
  api.addModule(control);
  api.assignMethods(output);
  // api.addModule(view);
  // let outputs = output($p)
  // api.result = outputs.result;
  api.addOperation('head', function() {
    api.resume('__init__');
    if(Object.keys($p.crossfilters).length > 0) api.match({});
    $p.getResult = $p.getRawData;
    return api;
  });

  $p.grid = {views: []};
  api.view = function(views) {
    if($p.grid.views.length !== 0) {
      $p.grid.reset();
    } 
    $p.grid = new Grid(views);
    $p.views = $p.grid.views;
    return api;
  }

  api.getViews = function () {
    return $p.views;
  }
  
  $p.reset = api.head;
  $p.exportResult = api.result;

  $p.setInput = function(inputName) {
    api.resume(inputName);
    return api;
  }

  $p.setOutput = function(outputName) {
    api.register(outputName);
    // console.log(api.result({outputTag: outputName, format: 'row'}))
    return api;
  }

  function configPipeline($p) {
    $p.extent = kernels.extent($p);
    // $p.operations = compile($p);
    let operations = operate($p);
    api.getOperations = () => Object.keys(operations);
    for(let optName of Object.keys(operations)) {
      api.addOperation(optName, operations[optName], true);
    }
    
    for(let ext of $p.extensions) {
      if(ext.getContext === true) {
        ext.function = ext.function($p);
      }
    }
    api.register('__init__');
  }
  
  api.data = function(dataOptions) {
    if (dataOptions.type === 'json') {
      let columns = cstore({
        schema: dataOptions.schema,
        size: dataOptions.source.length
      })
      .import({data: dataOptions.source});
      allocate($p, columns.data());
    } else {
      allocate($p, dataOptions);
    }
    configPipeline($p);
    $p.getResult = dataOptions.export;
    $p.cache = api.cache;
    $p.getRawData = dataOptions.export;
    $p.match = api.match;
    return api;
  }

  api.index = function(indexes) {
    data.indexes = indexes;
    return api;
  }

  let asyncPipeline = {};
  let asyncInput = function(arg) {
    let inputReady = false;
    for(let program of Object.keys(api).concat(Object.keys(kernels))) {
      asyncPipeline[program] = function(spec) {
        api.addToQueue(program, spec);
        return asyncPipeline;
      }
    }

    asyncPipeline.execute = function() {
      return input(arg).then(function(data){
        if(Array.isArray(arg.indexes)) {
          data.indexes = arg.indexes;
        }   
        api.data(data);
        api.async(true);
        api.run();
        api.async(false);
        inputReady = true;
        return new Promise(function(resolve, reject){
          resolve(api.result('row'))
          return api;
        })
      })
    }

    asyncPipeline.commit = asyncPipeline.execute;

    if(arg.dimX) $p.rowSize = arg.dimX;
    return asyncPipeline;
  }

  api.runJSON = function(jsonSpec) {
    let inputSpec = jsonSpec[0];
    if (!inputSpec.hasOwnProperty('input')) {
      throw Error('Error: No specification for input!');
    }
    let asyncPipeline = api.input(inputSpec)
    jsonSpec.slice(1).forEach(spec => {
      let opt = Object.keys(spec)[0];
      asyncPipeline[opt](spec[opt]);
    })

    return api;
  }

  api.getResult = function (d) {
    return $p.getResult(d);
  }

  api.clearWebGLBuffers = function() {
    let frameBuffers = ['offScreenFBO', 'visStats', null];
    frameBuffers.forEach(fb => {
      $p.bindFramebuffer(fb);
      $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
      $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
    })
  }

  api.runSpec = function(specs) {
    api.head();
    api.clearWebGLBuffers();
    $p.interactions = [];
    $p.responses = {};
    $p.crossfilters = [];
    $p.uniform.uFilterFlag.data = 0;
    api.clearQueue();
    // $p.uniform.uFilterRanges = $p.fieldDomains.concat($p.deriveDomains);
    specs.forEach(function(spec){
      let opt = Object.keys(spec)[0];
      let arg = spec[opt];
      opt = opt.slice(1); // ignore $ sign 
      if(typeof api[opt] == 'function') {
        api[opt](arg);
      }
    })
 
    return api;
  }
  
  api.interact = function(spec) {
    if(typeof(spec) != 'undefined') $p.interactions.push(spec);
    $p.interactions.forEach(function(interaction){
      // console.log(interaction)
      let callback = interaction.callback || function(selection) {
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
                } 
                // else if(!$p.strLists.hasOwnProperty(k)) {
                //     selection[k] = [selection[k][0] + selection[k][0] + 1];
                // }
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
          api.head().run();
          $p._responseType = 'unselected';
          $p._update = false;
          $p.uniform.uFilterLevel.data = 0.1;
          $p.uniform.uVisLevel.data = 0.1;
        }
      }
      interact($p, {
        actions: interaction.event,
        view: interaction.from,
        condition: interaction.condition,
        facet: interaction.facet,
        callback: callback  
      })
    })
  }
  $p.respond = api.interact;

  api.updateData = function(newData) {
    let data;
    if(newData._p4_cstore_version) {
      data = newData
    } else {
      let cache = cstore({
        schema: $p.dataSchema,
        strValues: $p.strValues
      })
      cache.addRows(newData)
      data = cache.data()
    }

    //update and combine all strValues
    Object.keys(data.strValues).forEach((attr) => {
      $p.strValues[attr] = Object.assign($p.strValues[attr], data.strValues[attr]);
    })

    if(data.size > 0) {
      $p.dataSize = data.size;
    }
    $p.fields
    .slice($p.indexes.length)
    .forEach((attr, ai) => {
      let buf = new Float32Array($p.dataDimension[0] * $p.dataDimension[1]);
      if(data[attr] === undefined) debugger;
      for (let i = 0, l = data[attr].length; i < l; i++) {
        buf[i] = data[attr][i];
      }
      $p.texture.tData.update(
        buf, [0, $p.dataDimension[1] * ai], $p.dataDimension
      );
      $p.fieldDomains[ai] = [
        Math.min(data.stats[attr].min, $p.fieldDomains[ai][0]),
        Math.max(data.stats[attr].max, $p.fieldDomains[ai][1])
      ]
      $p.fieldWidths[ai] = $p.fieldDomains[ai][1] - $p.fieldDomains[ai][0] + 1;
      if(data.strLists.hasOwnProperty(attr)){
        $p.fieldDomains[ai] = [0, data.strLists[attr].length - 1];
        $p.strLists[attr] = data.strLists[attr];
        $p.fieldWidths[ai] = data.strLists[attr].length;
      }
    });

    api.updateRegister('__init__', {
      fieldDomains: $p.fieldDomains,
      fieldWidths: $p.fieldWidths}
    )
    $p.uniform.uFieldDomains.data = $p.fieldDomains;
    $p.uniform.uFieldWidths.data = $p.fieldWidths;
    return api;
  }

  api.updateDataColumn = function(data, attribute) {
    if($p.fields.indexOf(attribute) === -1) {
      throw Error('Invalid attribute', attribute);
    }
    let buf = new Float32Array($p.dataDimension[0] * $p.dataDimension[1]);
    let attrId = $p.fields.indexOf(attribute) - $p.indexes.length;
    for (let i = 0, l = data[attribute].length; i < l; i++) {
      buf[i] = data[attr][i];
    }
    $p.texture.tData.update(
      buf, [0, $p.dataDimension[1] * attrId], $p.dataDimension
    );
  }

  api.updateDataRow = function(data, rowId) {
    let dataType = (Array.isArray(data)) ? 'array' : 'json';
    $p.fields.slice($p.indexes.length).forEach((attr, ai) => {
      let texPosX = rowId % $p.dataDimension[0];
      let value = (dataType == 'array') ? data[ai] : data[attr];
      if(value === undefined) throw Error('Cannot update data due to invalid data value');
      $p.texture.tData.update(
        new Float32Array(data[ai]), [texPosX, $p.dataDimension[1] * i], [1,1]
      );
    });
    return api;
  }

  api.extend = function(arg) {
    let extOptions = Object.assign({
      restartOnUpdate: true,
      skipDefault: false,
      exportData: false,
      getContext: false,
    }, arg)

    if(extOptions.name != undefined && 
      (typeof extOptions.function === 'function' 
      || typeof extOptions.constructor === 'function')
    ) {
      $p.extensions.push(extOptions);
    }
  }

  api.annotate = function ({
    id = 0,
    mark = 'vline',
    color = 'red',
    size = 3,
    position = {values: []}
  }) {
    let view = $p.views[0];
    if (Number.isInteger(id) && id < $p.views.length) {
      view = $p.views[id];
    } else {
      $p.views.filter(v => v.id == id);
      if (view.length > 0) {
        view = view[0];
      }
    }
    if (mark === 'vline') {
      let values = position[view.vmap.x || view.vmap.width] || position.values;
      values.forEach(val => {
        let x = view.chart.x(val);
        view.chart.svg.append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', 0)
          .attr('y2', view.height - view.padding.top - view.padding.bottom)
          .attr('stroke', color)
          .attr('stroke-width', size)
      })
    } else if (mark === 'hline') {
      let values = position[view.vmap.y || view.vmap.height] || position.values;
      values.forEach(val => {
        let y = view.chart.y(val);
        view.chart.svg.append('line')
          .attr('x1', 0)
          .attr('x2', view.width - view.padding.left - view.padding.height)
          .attr('y1', y)
          .attr('y2', y)
          .attr('stroke', color)
          .attr('stroke-width', size)
      }) 
    }
  }

  let inputDataOptions = options.data || options.input;
  if ($p.async && inputDataOptions) {
    return asyncInput(options.data)
  } else if ($p.async) { //no data option
    asyncPipeline.data = asyncInput;
    asyncPipeline.input = asyncInput;
    return asyncPipeline;
  } else {
    return api;
  }
}
