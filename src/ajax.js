export function request(arg) {
    var url = arg.url || arg,
        method = arg.method || "GET",
        dataType = arg.dataType || "json",
        data = arg.data || [],
        query = [];  //arraybuffer, blob, document, json, text

    for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }

    return new Promise(function(resolve, reject) {

        var req = new XMLHttpRequest();
        req.open(method, url);
        req.responseType = dataType;

        req.onload = function() {
          if (req.status == 200) {
            resolve(req.response);
          }
          else {
            reject(Error(req.statusText));
          }
        };

        req.onerror = function() {
          reject(Error("Network Error"));
        };

        if (method == 'POST') {
            req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }

        req.send(data);
    });
};

export let get = request;

export function getAll(options) {
    var promises = [];
    options.forEach(function(option){
        promises.push(
            ajax.get(option)
            .then(function(result){
                return new Promise(function(resolve, reject) {
                    resolve(result);
                });
            })
        );
    });

    return Promise.all(promises);
}

export function post(arg) {
    arg.method = "POST";
    return ajax.request(arg);
};
