export default function ($p) {
    return {
        view(views) {
            $p.views.forEach(function(v){
                if(v.hasOwnProperty('chart')) {
                    v.chart.svg.remove();
                    v.chart.removeAxis();
                    v.chart.removeLegend();
                    delete v.chart;
                }
                if(!v.hasOwnProperty('padding')) {
                    v.padding = {left: 30, right: 30, top: 30, bottom: 30};
                }
            })
            $p.views = views;
            return this;
        },

        addView(view) {
            $p.views.push(view);
        },

        updateViews(views) {
            $p.views = views;
            return this;
        },

        resetViews() {
            $p.views.forEach(function(v){
                if(v.hasOwnProperty('chart')) {
                    v.chart.svg.remove();
                    delete v.chart;
                }
            })
            return this;
        },

        generateViews({
            layout = 'rows',
            count = 1,
            width = 640,
            height = 480,
            padding = {left: 0, right: 0, top: 0, bottom: 0}
        }) {
            let views = new Array(count);
            let calcOffset;
            if (layout == 'rows') {
                height = height / count
                calcOffset = (index) => [0, index * height / count];
            } else {
                width = width / count
                calcOffset = (index) => [index * width / count, 0];
            }
            for (let i = 0; i < count; i++) {
                let offset = calcOffset(i);
                views[i] = {width, height, padding, offset};
            }
            return views
        }
    }
}

