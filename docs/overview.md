## Introduction
P4 leverages GPU computing via WebGL to accelerate data processing and visualization. It provides declarative grammar for specifying data-parallel operations that runs efficiently on the GPU.

Here is an overview of the documentation for P4.

* [Data I/O](#/documentation/data) - Upload data to GPU and get the data processing results back.
* [Transformation](#/documentation/transformation) - Process data using common transformations such as filter and group-by.
* [Visualization](#/documentation/visualization) - Setup views and plot the data processing results with various visualizations.
* [Interaction](#/documentation/interaction) - Enable user interactions for data transformations and visualizations.
* [Annotation](#/documentation/annotation) - Add annotations and marker on visualizations.
* [Extension](#/documentation/extension) - Extend or add custom data transformation and visualization operations.

### Syntax

P4's declarative grammar can be used in JavaScript for developing web-base applications.

##### JavaScript
```javascript
// setup
let p = p4(config).data({...}).views({...});

// data transformations
p.derive({...}).match({...}).aggregate({...});

//interactive visualizations
p.visualize({...}).interact({...});             

```

A JSON syntax is also supported for rapidly explore large datasets using GPU computing, as well as for other programming languages and high-level systems to easily generate design specifications.

##### JSON
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

