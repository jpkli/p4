## Data Transformation
Using GPU computing to process data or perform data transformations on the web is non-trivial. P4 allows common data transformations, such as filtering, deriving new values, and aggregation, to be easily performed using WebGL.

Data transformations in P4 can be described as a *pipeline* as the example given below. 

```javascript
p4.pipeline(...).data(...)
  .derive({ AgeDiff: 'abs(FatherAge - MotherAge)' })
  .match({ 
    FatherAge: [30, 60],
    AgeDiff: [0, 10]
  })
  .aggregate({
    $group: 'AgeDiff',
    $collect: {
      Babies: {$count: '*'},
      AvgWeight: {$avg: 'BabyWeight'}
    }
  })
```
In this example, a new attribute (*AgeDiff*) is derived from existing attributes. Then the *Match* operation is used to filter the data using *AgeDiff* and another data attribute. Finally, a group-by aggregation is used to group the data based on *AgeDiff* to collect the number of babies and their average birth weights for each group.
<!-- 
Please see the specification methods for each data-parallel transformations:

* [Match](#/documentation/match) - Filter data by matching user-specified criteria.
* [Derive](#/documentation/derive) - Calculate new attributes using existing attributes and user-defined logics.
* [Aggregate](#/documentation/aggregate) - Aggregate data based on specified attribute.
-->

### Derive
*Derive* is for calculating new attributes based on existing data attributes.

```javascript
derive({
  NewAttribute1: 'expression with existing attributes and math functions',
  NewAttribute2: 'expression2',
  ...
})
```
Supported math functions: abs, ceil, cos, exp, log, log2, max, min, pow, round, sin, sqrt, tan, acos, asin, atan.
At default, 4 new numerical attributes can be derived (for saving GPU memory space). To add more, specify it in the config of the pipeline:

```javascript
p4.config({deriveMax: 8}).derive({...}) //now it can derive 8 new attributes.
```

### Match
*Match* can be used to filer the data based on multiple data attributes, including both numeric and categorical.

```javascript
match({
  NumericAttribute1: [start, end],
  NumericAttribute2: {$in: [number1, number2, ...]},
  CategoricalAttribute1: {$in: [string1, string2, ...]}
  ...
})
```

### Aggregate
*Aggregate* is used to group or bin data based on attributes to obtain specified metrics.
```javascript
aggregate({
  $group: [attr1, attr2], // up to 3 attributes (current limitation),
  $collect: {
    newAttr1Name: {$opt: 'attr3'}, 
    newAttr2Name: {$opt: 'attr4'}, 
  }
})
```
Supported \$opt: count, sum, avg, min, max

