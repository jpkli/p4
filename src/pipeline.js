export default function pipeline($p) {    
    let pipeline = {};
    let async = false;
    let optID = 0;
    let queue = [];
    
    pipeline.addModule = function(mod) {
        Object.assign(pipeline, mod($p));
        return pipeline;
    }

    pipeline.addToQueue = function (opt, arg) {
        if(!$p._update && !$p._progress) {
            let spec = {};
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
                if(!async) {
                    pipeline.addToQueue(name, arg);
                }
                let getResult = operation(arg);
                if(typeof(getResult) === 'function') {
                    $p.getResult = getResult;
                }
                return pipeline;
            }
        }   
    }

    pipeline.clearQueue = function() {
        queue = [];
        return pipeline;
    }

    pipeline.run = function(jobs = queue) {

        for (let q of jobs) {
            let opt = Object.keys(q)[0];
            if(typeof pipeline[opt] === 'function') {
                pipeline[opt](q[opt]);
            }
        }

        return pipeline;
    }

    pipeline.queue = function() {
        return queue;
    }

    pipeline.async = function(isAsync) {
        async = isAsync;
    }

    return pipeline;
}