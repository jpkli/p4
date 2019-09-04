export default function pipeline($p) {    
    let pipeline = {};
    let async = false;
    let optID = 0;
    let queue = [];
    
    pipeline.addModule = function(mod) {
        let newModule = mod($p)

        Object.keys(newModule).forEach(name => {
            if (typeof(newModule[name]) === 'function') {
                pipeline[name] = function() {
                    newModule[name].apply(null, arguments);
                    return pipeline;
                }
            }
        })
        return pipeline;
    }

    pipeline.assignMethods = function(mod) {
        let newModule = mod($p)

        Object.keys(newModule).forEach(name => {
            if (typeof(newModule[name]) === 'function') {
                pipeline[name] = function() {
                    return newModule[name].apply(null, arguments);
                }
            }
        })
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

    pipeline.addOperation = function(name, operation, overwrite = false) {
        if(!pipeline.hasOwnProperty(name) || overwrite) {
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