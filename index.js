const hopper = require('./src/Hopper');
const middlwares = require('./src/middlewareCreators');

module.exports = hopper;
module.exports.koaMiddlewareCreator = middlwares.koa.middlewareCreator;
module.exports.expressMiddlewareCreator = middlwares.express.middlewareCreator;
