
export default function () {
    let config = {
        container: "p4",
        viewport: [1000, 800]
    };
    
    let views = [
        {
          id: 'c1', width: 900, height: 800, 
          gridlines: {y: true, x: true},
          padding: {left: 70, right: 10, top: 50, bottom: 70},
          offset: [0, 200]
        },
    ];

    let pp = p4(config).view(views);

    pp.input({
      source: '../data/california_housing_train.csv',
      type:'text',
      method: 'http'
    })
    .visualize({
      id: 'c1',
      mark: 'circle',
      size: 10,
      y: 'longitude',
      x: 'latitude',
      color: 'auto',
      zoom: {

      }
      // opacity: 'auto'
    })
    .execute()
    .then(function(data){
      console.log(data)
    })
}