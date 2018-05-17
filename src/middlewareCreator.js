const onFinished = require('on-finished');
const { TYPE_KOA, TYPE_EXPRESS } = require('./consts');

const onRequestWrapper = ({
  fieldInterpreters,
  resolver,
  handler,
  timestamps,
  immediate,
  ignore,
}) => (requestTime, ...args) =>
  function onRequestHandler() {
    if (typeof ignore === 'function' && ignore(...args)) {
      return;
    }

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

    Object.keys(entry).forEach(key => entry[key] === undefined && delete entry[key]);

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
  // Trigger cache getter ip because later it will be undefined
  req.ip; // eslint-disable-line no-unused-expressions
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
