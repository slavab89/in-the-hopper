const koaMiddleware = require('./koaMiddlewareCreator');
const expressMiddleware = require('./expressMiddlewareCreator');

module.exports = {
  koa: {
    middlewareCreator: koaMiddleware.middlewareCreator,
    defaultResolvers: koaMiddleware.defaultResolvers,
  },
  express: {
    middlewareCreator: expressMiddleware.middlewareCreator,
    defaultResolvers: expressMiddleware.defaultResolvers,
  },
};
