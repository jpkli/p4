## Introduction

P4 leverages GPU computing via WebGL to accelerate data processing and visualization.


### Pipeline
P4 provides a flexible and easy-to-use programming interface for specifying data-parallel operations in a *pipeline* that runs efficiently on the GPU.

#### JavaScript Syntax
```javascript
p4.data({...})
  .derive({...})
  .match({...})
  .aggregate({...})
  .visualize({...})
  .interact({...});

```
<img style="float: right;" height="320" src="/docs/images/barchart.png">
#### JSON Specification
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

![Example Image](/docs/images/barchart.png)
