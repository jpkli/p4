// import p4 from '../'; //p4 is loaded globally

export default function() {
  let dataset = new p4.datasets.Babies(10000);

  let app = p4({
    container: "p4-example",
    viewport: [400, 300]
  })
  
  app.data({
    format: 'json',
    values: dataset.data,
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
  })

  app.match({
    BabyWeight: [10, 25]
  })
  .aggregate({
    $group: 'MotherEdu',
    $collect: {
      Babies: {$count: '*'}
    }
  })
  
  let res = app.result('json');
  // console.log(res);

  app.view([
    {
      id: 'bar-chart',
      width: 400,
      height: 300, 
      padding: {left: 150, right: 20, top: 20, bottom: 60}
    },
  ])
  .visualize({
    mark: 'bar',
    y: 'MotherEdu',
    width: 'Babies',
    color: 'steelblue'
  })
}