export default class Grid {
    constructor(views) {
        this.views = views
    }

    add (view) {
        this.view.push(view)
    }

    reset () {
        this.views.forEach(function(v){
            if(v.hasOwnProperty('chart')) {
                v.chart.svg.remove()
                v.chart.removeAxis()
                v.chart.removeLegend()
                delete v.chart
            }
        })
    }

    generateViews ({
        layout = 'rows',
        count = 1,
        width = 640,
        height = 480,
        padding = {left: 0, right: 0, top: 0, bottom: 0},
        gridlines = {x: false, y: false}
    }) {
        let views = new Array(count)
        let calcOffset
        // height -= padding.top + padding.bottom;
        // width -= padding.left + padding.right;
        if (layout == 'rows') {
            height = height / count
            calcOffset = (index) => [0, index * height]
        } else {
            width = width / count
            calcOffset = (index) => [index * width, 0]
        }
        for (let i = 0; i < count; i++) {
            let offset = calcOffset(i)
            views[i] = {width, height, padding, offset, gridlines}
        }
        this.views = views;
        return views;
    }
}