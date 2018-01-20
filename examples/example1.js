p4.data({
    protocol: "file",
    path: "./Nat2015usa.csv",
    attributes : {
      BabyWeight  : "float",
      BabyGender  : "string",
      MotherAge   : "int",
      MotherRace  : "string",
      MotherHeight: "float",
      MotherWeight: "float",
      FatherAge   : "int",
      FatherRace  : "string"
    }
})
.derive(
    ParentAgeDifference: function(d) { return d.FatherAge - d.MotherAge }
})
.fitler({
    ParentAgeDifference: [0, 10]
})
.aggregate({
    $group: "AgeDiff",
    $collect: {
        BabyCount: { $count : "*"},
        AvgWeight: { $avg: "BabyWeight"}
    }
})
.visualize({
    mark: "bar",
    x: "ParentAgeDifference",
    y: "BabyCount"
})
