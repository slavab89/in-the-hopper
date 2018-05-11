const onFinished = require('on-finished');
const { TYPE_KOA, TYPE_EXPRESS } = require('./consts');

const onRequestWrapper = ({ fieldInterpreters, resolver, handler, timestamps, immediate }) => (
  requestTime,
  ...args
) =>
  function onRequestHandler() {
    const responseTime = Date.now() - requestTime;
    const entry = resolver(fieldInterpreters, ...args);

    if (timestamps) {
      if (
        (typeof timestamps === 'object' && timestamps.requestTime === true) ||
        timestamps === true
      ) {
        entry.requestTime = requestTime;
      }
      if (
        !immediate &&
        ((typeof timestamps === 'object' && timestamps.responseTime === true) ||
          timestamps === true)
      ) {
        entry.responseTime = responseTime;
      }
    }

    handler(entry);
  };

const triggerHandlerWrapper = ({ onRequestHandler, immediate }) => res => (...args) => {
  const requestTime = Date.now();
  const requestHandler = onRequestHandler(requestTime, ...args);
  if (immediate) {
    requestHandler();
  } else {
    onFinished(res, requestHandler);
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
