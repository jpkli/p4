## Data I/O

Data I/O supports JavaScript arrays, objects, and Typed Array. Other common formats including CSV and JSON are also supported.

### Input
```javascript
var ex = P4.pipeline()
  .data({
    source: ...,
    format: ...,
    schema: {...}
  });
```

#### Data Input Schema
The schema is used to specified the data types for all the attributes. Data types can be integer, float, or string.  
```javascript
schema: {
    BirthMonth   : "int",
    BabyGender   : "string",
    BabyWeight   : "float",
    MotherAge    : "int",
    MotherRace   : "string",
    ...
}
```

### Output

```javascript
var result = ex.aggregate({...}).output({format: "json"});
```
