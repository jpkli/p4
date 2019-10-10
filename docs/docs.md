P4 provides declarative grammar for specifying data-parallel operations in a *pipeline* that runs efficiently on the GPU.

#### JSON Syntax
```json
{
  "data": { ... },
  "views": [ ... ],
  "operations": [
    { "$match": { ... } },
    { "$derive": { ... } },
    { "$aggregate": { ... } },
    { "$visualize": { ... } },
    { "$interact": { ... } }
  ]
}
```
#### Data Input
Data source and format need to be specified for initializing a P4 *pipeline*. The schema is used to specified the data types for all the attributes. Data types can be integer, float, or string.

```json
{
  "data" :{
    "source": ...,
    "format": ...,
    "schema": {
        "BirthMonth"   : "int",
        "BabyGender"   : "string",
        "BabyWeight"   : "float",
        "MotherAge"    : "int",
        "MotherRace"   : "string",
        ...
    }
  }
}
```
#### Data Transformation
Supported parallel data transformations: Match, Derive, Aggregate
```json
{ "$derive": {"AgeDiff": "abs(FatherAge - MotherAge)"} },
{ "$match": { "AgeDiff": [0, 10]} },
{ "$aggregate" : {
        "$group": "AgeDiff",
        "$reduce" : {
            "Babies": { "$count": "*"},
            "BabyAvgWeight": { "$avg": "BabyWeight"}
        }
    }
}
```

#### Visualization
Supported visual encodings: `x`, `y`, `color`, `opacity`, `size`, `width`, and `height`. Visual marks can be specified as rect, circle, bar, and line.
The following example visualizes a scatter plot.
```json
{
    "$visualize": {
        "mark": "circle",
        "size": 8,
        "color": "steelblue",
        "opacity": 0.15,
        "x": "MotherWeight",
        "y": "BabyWeight"
    }
}    
```

#### Interaction
Common interactions, such as click, hover, brush, zoom, and pan can be specified to interact with visualizations.
```json
{
    "$interact": {
        "event": "brush",
        "from": "c1",
        "response" : {
            "chart1": {"unselected": {"color": "gray"}},
            "chart2": {"selected": {"color": "orange"}}
        }
    }
}
```
