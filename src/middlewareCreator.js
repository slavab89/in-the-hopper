const onFinished = require('on-finished');
const { TYPE_KOA, TYPE_EXPRESS } = require('./consts');

const onRequestWrapper = ({ fieldInterpreters, resolver, handler }) => (startTime, ...args) =>
  function onRequestHandler() {
    let responseTime;
    if (startTime) {
      responseTime = Date.now() - startTime;
    }
    const entry = resolver(fieldInterpreters, ...args);

    if (responseTime && fieldInterpreters.responseTime) {
      entry.responseTime = responseTime;
    }

    handler(entry);
  };

const triggerHandlerWrapper = ({ onRequestHandler, immediate }) => res => (...args) => {
  if (immediate) {
    onRequestHandler(null, ...args);
  } else {
    const startTime = Date.now();
    onFinished(res, onRequestHandler(startTime, ...args));
  }
};

const koaMiddlewareWrapper = triggerHandler => async (ctx, next) => {
  triggerHandler(ctx.res)(ctx);
  await next();
};

const expressMiddlewareWrapper = triggerHandler => (req, res, next) => {
  triggerHandler(res)(req, res);
  next();
};

module.exports = ({ middlewareCreator, type }, middlewareOpts) => {
  let middleware;

  if (middlewareCreator) {
    middleware = middlewareCreator(middlewareOpts);
  } else {
    const onRequestHandler = onRequestWrapper(middlewareOpts);
    const triggerHandler = triggerHandlerWrapper({
      onRequestHandler,
      immediate: middlewareOpts.immediate,
    });

    if (type === TYPE_KOA) {
      middleware = koaMiddlewareWrapper(triggerHandler);
    } else if (type === TYPE_EXPRESS) {
      middleware = expressMiddlewareWrapper(triggerHandler);
    }
  }

  return middleware;
};
