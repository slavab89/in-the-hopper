module.exports.middlewareCreator = function koaMiddlewareCreator({ fields, formatter, handler }) {
  return async function hopperMiddleware(ctx, next) {
    const startTime = Date.now();

    await next();

    const responseTime = Date.now() - startTime;
    const entry = formatter(fields, ctx);

    if (fields.responseTime) {
      entry.responseTime = responseTime;
    }

    await handler(entry);
  };
};

function defaultResolver(field) {
  return ctx => ctx[field];
}

module.exports.defaultResolvers = {
  responseTime: () => -1,
  status: defaultResolver('status'),
  ip: defaultResolver('ip'),
  method: defaultResolver('method'),
  url: defaultResolver('url'),
  contentLength: defaultResolver('length'),
  contentType: defaultResolver('type'),
  host: defaultResolver('host'),
  headers: defaultResolver('headers'),
  userAgent: ctx => ctx.get('user-agent'),
};
