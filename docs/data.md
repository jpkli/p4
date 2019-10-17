## Data I/O

P4 supports JavaScript arrays, objects, and Typed Array for input and output. As the data are stored in GPU memory for using the GPU for both processing and rendering data, P4 provides functions for uploading and downloading data to/from GPU. It supports JavaScript arrays, objects, and Typed Array.

### Input
```javascript
data({format, values, schema, method, url})
```

* format (default: 'cstore')
  A **String** specifying the format of the input data. Supported formats: 'json', 'array', 'cstore'. (Note: *cstore* is the default data format used in P4 that arrange a tabular dataset in an array of TypedArray columns).

* values
  An **Array** storing the data.

* schema
  A **Object** specifying all the data attributes and their data types. Data types can be '*int*', '*float*', or '*string*'.

* method (default: 'memory')
  A **String** specifying the method for getting the data from local or remote locations. Supported methods: *'memory'*, *'file'*, *'http'*, *'websocket'*
  
* url
  A *String* specifying a remote location of the data


#### Example

Let's say we have a dataset as an array of JavaScript in memory locally. It can be simply loaded to the GPU memory as the example below.

##### Local data example:

```javascript
let example = p4(config).data({
  format: 'json',
  values: jsonData,
  schema: {
    BirthMonth   : "int",
    BabyGender   : "string",
    BabyWeight   : "float",
    MotherAge    : "int",
    MotherRace   : "string"
    ...
  }
})

```

### Output 
To get the results from GPU memory, just use:

```javascript
result({format, outputTag})
```
* format (default: 'json')
  A **String** specifying the format of the output. Supported formats: 'json', 'array', 'cstore';

* outputTag (optional)
  A **String** specifying the data transformation results to be return.


#### Example

```javascript
let result = example.aggregate({...}).result({format: "json"});
```
