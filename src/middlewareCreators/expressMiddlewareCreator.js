const onFinished = require('on-finished');

module.exports.middlewareCreator = function createConnectMiddleware({
  fields,
  formatter,
  handler,
}) {
  return function hopperMiddleware(req, res, next) {
    const startTime = Date.now();
    function onResponseFinish() {
      const responseTime = Date.now() - startTime;

      const entry = formatter(fields, req, res);

      if (fields.responseTime) {
        entry.responseTime = responseTime;
      }

      handler(entry);
    }

    onFinished(res, onResponseFinish);
    next();
  };
};

function requestResolver(field) {
  return req => req[field];
}

function responseHeaderResolver(field) {
  return (req, res) => res.get(field);
}

module.exports.defaultResolvers = {
  responseTime: () => -1,
  status: (req, res) => res.statusCode,
  ip: requestResolver('ip'),
  method: requestResolver('method'),
  url: requestResolver('url'),
  contentLength: responseHeaderResolver('content-length'),
  contentType: responseHeaderResolver('content-type'),
  host: requestResolver('hostname'),
  headers: requestResolver('headers'),
};
