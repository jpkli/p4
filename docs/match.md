*Match* can be used to filer the data based on multiple data attributes, including both numeric and categorical.

#### Syntax

```javascript
match({
  NumericAttribute1: [start, end],
  NumericAttribute2: {$in: [number1, number2, ...]},
  CategoricalAttribute1: {$in: [string1, string2, ...]}
  ...
})
```

#### Example

```javascript
match({
  BabyWeight: [8, 15],
  FatherAge: [30, 50],
  MotherEdu: {$in: ['Master']}
})
```
