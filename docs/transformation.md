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