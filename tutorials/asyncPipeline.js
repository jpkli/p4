import p4 from '../';

export default function() {
  let dataset = new p4.datasets.Babies(10000);

  let app = p4({
    container: "p4-example",
    viewport: [400, 300],
    async: true
  });

  app.data({
    type: 'json',
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
    },
    source: dataset.data
  });

  app.match({
    BabyMonth: [0, 5]
  })
  .aggregate({
    $group: 'MotherRace',
    $collect: {
      count: {$count: '*'}
    }
  })
  .execute()
  .then( res => {
    console.log(res);
  })
}
