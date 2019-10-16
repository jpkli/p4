#### Data Transformation
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

Please see the specification methods for each data-parallel transformations:


* [Match](#/documentation/match) - Filter data by matching user-specified criteria.
* [Derive](#/documentation/derive) - Calculate new attributes using existing attributes and user-defined logics.
* [Aggregate](#/documentation/aggregate) - Aggregate data based on specified attribute.