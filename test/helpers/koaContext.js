module.exports = function createKoaContext(req, res) {
  const ctx = {
    req,
    res,
    query: {},
    state: {},
    params: {},
    get: header => req.headers[header],
  };

  Object.defineProperty(ctx, 'status', {
    get: () => res.statusCode,
  });

  Object.defineProperty(ctx, 'method', {
    get: () => req.method,
  });

  Object.defineProperty(ctx, 'url', {
    get: () => req.url,
  });

  Object.defineProperty(ctx, 'headers', {
    get: () => req.headers,
  });

  return ctx;
};
