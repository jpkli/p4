export default function pipeline($p) {    
    let pipeline = {};
    let optID = 0;
    let queue = [];
    
    pipeline.addModule = function(mod) {
        Object.assign(pipeline, mod($p));
        return pipeline;
    }

    pipeline.addToQueue = function (opt, arg) {
        if(!$p._update) {
            var spec = {};
            spec[opt] = arg;
            queue.push(spec);
            return optID++;
        } else {
            return -1;
        }
    }

    pipeline.addOperation = function(name, operation) {
        if(!pipeline.hasOwnProperty(name)) {
            pipeline[name] = function(arg) {
                pipeline.addToQueue(name, arg);
                $p.getResult = operation(arg);
                return pipeline;
            }
        }
        
        
    }

    pipeline.clearQueue = function() {
        queue = [];
        return pipeline;
    }

    pipeline.run = function() {
        for (let q of queue) {
            let opt = Object.keys(q)[0];
            if(typeof pipeline[opt] === 'function') {
                pipeline[opt](q[opt]);
            }
        }
        return pipeline;
    }

    return pipeline;
}