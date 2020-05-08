export default function ($p, vmap, viewIndex, domains) {
  let chart = $p.views[viewIndex];
  let width = chart.width;
  let height = chart.height;
  let padding = chart.padding || $p.padding;

  $p.extensions.forEach((ext) => {
    if (ext.condition.call(null, vmap)) {
      let dataDomains = {};
      Object.keys(domains).forEach(f => {
        if ($p.uniqueValues && $p.uniqueValues.hasOwnProperty(f)) {
          let last = $p.uniqueValues[f].length - 1;
          dataDomains[f] = [$p.uniqueValues[f][0], $p.uniqueValues[f][last]];
        } else if($p.strLists.hasOwnProperty(f)) {
          dataDomains[f] = $p.strLists[f];
        } else {
          dataDomains[f] = domains[f];
        }
      })

      $p.skipRender = ext.skipDefault;
      let data = {
        json: null,
        array: null,
        texture: null,
        vmap: vmap,
        fields: $p.fields,
        schema: $p.dataSchema,
        domains: dataDomains
      };

      let view = Object.assign({}, chart);
      view.width = width - padding.left - padding.right;
      view.height = height - padding.top - padding.bottom;
      view.encodings = vmap;
      view.svg = chart.chart.svg.svg;
      view.canvas = $p.canvas;
      view.gridlines = view.gridlines;

      if (ext.exportData) {
        data.json = $p.exportResult({format: 'row', outputTag: vmap.in});
      }

      if ($p.dataSchema) {
        data.json.forEach(row => {
          Object.keys($p.dataSchema).forEach(key => {
            if ($p.dataSchema[key] === 'time') {
              row[key] = new Date(row[key])
            }
          })
        })
      }
      if (typeof ext.onready === 'function') {
        ext.onready.call($p, data, view);
      }

      let execution = (ext.type == 'class')
        ? function (data, view) {
          chart.plot = new ext.function(data, view)
          if (typeof chart.plot.render === 'function') {
            chart.plot.render()
          }
          return chart.plot;
        } 
        : ext.function;

      if (ext.restartOnUpdate) {
        execution.call(ext, data, view);
      } else {
        if (!$p._update) {
          chart.extChart = execution.call(ext, data, view);
        }
      }
    }
  })
}