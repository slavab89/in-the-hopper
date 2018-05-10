const onFinished = require('on-finished');
const { TYPE_KOA, TYPE_EXPRESS } = require('./consts');

const onResponseFinishWrapper = ({ fieldInterpreters, resolver, handler }) => (
  startTime,
  ...args
) =>
  function onResponseFinish() {
    const responseTime = Date.now() - startTime;
    const entry = resolver(fieldInterpreters, ...args);

    if (fieldInterpreters.responseTime) {
      entry.responseTime = responseTime;
    }

    handler(entry);
  };

const koaMiddlewareWrapper = onResponseFinishHandler => async (ctx, next) => {
  const startTime = Date.now();
  onFinished(ctx.res, onResponseFinishHandler(startTime, ctx));
  await next();
};

const expressMiddlewareWrapper = onResponseFinishHandler => (req, res, next) => {
  const startTime = Date.now();
  onFinished(res, onResponseFinishHandler(startTime, req, res));
  next();
};

module.exports = ({ middlewareCreator, type }, middlewareOpts) => {
  let middleware;

  if (middlewareCreator) {
    middleware = middlewareCreator(middlewareOpts);
  } else {
    const finish = onResponseFinishWrapper(middlewareOpts);

    if (type === TYPE_KOA) {
      middleware = koaMiddlewareWrapper(finish);
    } else if (type === TYPE_EXPRESS) {
      middleware = expressMiddlewareWrapper(finish);
    }
  }

  return middleware;
};
