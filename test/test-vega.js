define(function(){
    return function testVega(data, domain) {
        var spec = {
          "$schema": "https://vega.github.io/schema/vega/v3.0.json",
          "width": 800,
          "height": 800,
          "padding": 5,
          "autosize": "pad",

          "data": [
            {
              "name": "source",
              "values": data,
              "transform": [
                //   {"type": "formula", "as": "rati", "expr": "datum.Weight / datum.MotherWeight"}
                //  {
                //   "type": "aggregate",
                //   "groupby": ["MotherAge"],
                //   "fields": ["Weight", "MotherWeight"],
                //   "ops": ["count", "sum"],
                //   "as": ["v", "s"]
                // }
                  { "type": "filter", "expr": "datum.Weight < 1000 && datum.MotherWeight > 200" }
              ]
            }
          ],

          "scales": [
            {
              "name": "x",
              "type": "linear",
              "round": true,
              "nice": true,
              "zero": true,
              "domain":[0,6000],
              "range": [0,800]
            },
            {
              "name": "y",
              "type": "linear",
              "round": true,
              "nice": true,
              "zero": true,
              "domain": [0,400],
              "range": [800,0]
            }
          ],

          "axes": [
            {
              "scale": "x",
              "grid": true,
              "domain": false,
              "orient": "bottom",
              "tickCount": 5,
              "title": "x"
            },
            {
              "scale": "y",
              "grid": true,
              "domain": false,
              "orient": "left",
              "titlePadding": 5,
              "title": "y"
            }
          ],

          "marks": [
            {
              "name": "marks",
              "type": "symbol",
              "from": {"data": "source"},
              "encode": {
                "update": {
                  "x": {"scale": "x", "field": "Weight"},
                  "y": {"scale": "y", "field": "MotherWeight"},
                  "shape": {"value": "circle"},
                  "opacity": {"value": 0.5},
                  "fill": {"value": "#4682b4"}
                }
              }
            }
          ]
        }

        var timestamp = performance.now();
        var profile = {
           init: timestamp,
           transform: null,
           render: null,
           total: timestamp
        };

        parsed = vega.parse(spec);

        view = new vega.View(parsed)
        .logLevel(vega.Info)
        // .renderer('canvas')  // set renderer (canvas or svg)
        .initialize('#vis') // initialize view within parent DOM container

        timestamp = performance.now();
        profile.init = timestamp - profile.init;
        profile.transform = timestamp;
        view.run();
        timestamp = performance.now();
        profile.transform = timestamp - profile.transform;
        profile.render = timestamp;
        view.render();
        timestamp = performance.now();
        profile.render = timestamp - profile.render;

        profile.total = timestamp - profile.total;
        profile.exec = profile.total - profile.init;
        return profile;
    }
})
