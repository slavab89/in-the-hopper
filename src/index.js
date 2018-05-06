const hopper = require('./Hopper');
const middlwares = require('./middlewareCreators');

module.exports = hopper;
module.exports.koaMiddlewareCreator = middlwares.koa.middlewareCreator;
module.exports.expressMiddlewareCreator = middlwares.express.middlewareCreator;
