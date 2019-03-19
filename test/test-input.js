import testSpec from './test-spec';

export default function () {

    let config = {
        container: "p4",
        viewport: [1000, 600]
    };
    
    let views = [
        {
            id: 'c1', width: 900, height: 400, 
            gridlines: {y: true},
            padding: {left: 70, right: 10, top: 50, bottom: 40},
            offset: [0, 200]
        },
        {
            id: 'c2', width: 900, height: 200, 
            gridlines: {y: true},
            padding: {left: 70, right: 10, top: 0, bottom: 40},
            offset: [0, 0]
        }
    ];

    let pp = p4(config).view(views);

    // document.getElementById('abutton').onclick = function(){
    //     pp.ctx.animation.stop = !pp.ctx.animation.stop;

    //     if(!pp.ctx.animation.stop) {
    //         pp.ctx.animation.start();
    //     }
    // }
    testSpec(pp);
}