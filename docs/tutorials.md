## Introduction
P4 is designed for building high-performance and interactive systems for exploratory analysis and visualization of big data. It provides high performance by leveraging GPU computing to accelerate both data processing and rendering, while offering a simple programming interface with declarative grammars for rapid specification of data transformations, visualizations, and interactions.

<!-- The mission of P4 is to help more people use data analytics and visualization with GPU computing. P4 makes it possible for visualization designers and system developers with little or no knowledge in parallel programming and GPU computing to develop data analytics and visualization applications that efficiently run on the GPU. -->


### Getting Started
This guide will walk through the steps for using P4 to process and visualize large data on the web.

#### Usage
To use P4 in a web page, just load the script as following.

```xml
<script src="https://github.com/jpkli/p4/dist/p4.js"></script>
```

Or, install via npm or yarn:

```javascript
npm install p4.js
// or
yarn add p4.js
```

Then P4 can be used with *ES6/ES2015 import* for building web apps:


```javascript
import p4 from 'p4.js';
```

#### Initialization
Let's say we have a *div* with an id (e.g., &lt;div id="p4-example" /&gt;), the follow code will initialize a p4 *pipeline*. 

```javascript
let app = p4({
    container: "p4-example",
    viewport: [800, 600]
})
```

#### Data
Let's say that we have a tabular data with multiple categorical and numerical attributes.

```json
BirthMonth,BabyGender,BabyWeight,MotherAge,MotherRace,MotherStatus,MotherEdu,MotherHeight,MotherWeight,...
01,M,7.71837462,36,White,Married,Master,66,187,03,42,White,Associate
01,F,6.8673913,25,Asian,Married,High School Grad.,60,122,46,28,White,High School
01,F,8.3996022,28,White,Married,Bachelor,69,228,00,31,White,High School
01,F,7.7492393,33,White,Married,Bachelor,62,160,18,34,White,Some College
01,M,4.98023658,30,Asian,Married,High School,60,110,09,62,Asian,High School
01,F,7.0217147,29,Mixed,Married,Bachelor,63,164,18,31,White,Some College
...
```

If the data are in JSON format , it can be loaded by specifying it as 'json' type and the associated data attributes with their data types (int, float, or string).

```javascript
app.data({
  format: 'json',
  values: jsonData,
  schema: {
    BabyMonth: "int",
    BabyGender: "string",
    BabyWeight: "float",
    MotherAge: "int",
    MotherRace: "string",
    MotherStatus: "string",
    MotherEdu: "string",
    MotherHeight: "int",
    MotherWeight: "float",
    MotherWgtGain: "float",
    FatherAge: "int",
    FatherRace: "string",
    FatherEdu: "string",
  }
});
```

This will load the data into the GPU memory, then we can start process the data.

#### Data Processing

For example, we can use *match* and *aggregate* to filter and group the data based on any attributes:

```javascript
app.match({
  BabyWeight: [10, 25]
})
.aggregate({
  $group: 'MotherEdu',
  $collect: {
    count: {$count: '*'}
  }
});
```

To get the results back in JSON format:

```javascript
let res = app.result('json');
console.log(res);
```

Output:
```json
[
  {MotherRace: "Mixed", count: 114},
  {MotherRace: "Asian", count: 211},
  {MotherRace: "Black", count: 230},
  {MotherRace: "White", count: 109}
]
```

#### Visualization
In addition to outputting JSON, the result can be visualized using P4's declarative visualization grammar: 

```javascript
app.view([
  {
    id: 'bar-chart',
    width: 400,
    height: 300, 
    padding: {left: 150, right: 20, top: 50, bottom: 40}
  },
])
.visualize({
  mark: 'bar',
  y: 'MotherEdu',
  width: 'Babies',
  color: 'steelblue'
})
```

<div id="p4-example" style="border: 1px solid #ccc; margin-bottom: 2em;"></div>

### Next Step

Please see our [examples](#/examples) and [documentation](#/documentation).
You can also join our [discussion group](https://groups.google.com/forum/#!forum/p4js). 