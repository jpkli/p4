
let spec = {
  $aggregate: {
    $group: ['FatherEdu'],
    $collect: {
      maxMotherWeight: {$max: 'MotherWeight'},
      sumWeight: {$sum: 'BabyWeight'},
      minMotherWeight: {$min: 'MotherWeight'},
      averageAge: {$avg: 'MotherAge'},
      count: {$count: '*'}
    }
  }
}
