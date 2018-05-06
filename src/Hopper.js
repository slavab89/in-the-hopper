const middlwares = require('./middlewareCreators');

function defaultHandler(message) {
  console.log(JSON.stringify(message));
}

function formatJSON(fields, ...args) {
  const entryObject = Object.entries(fields).reduce((result, [field, resolver]) => {
    Object.assign(result, { [field]: resolver(...args) });
    return result;
  }, {});

  return entryObject;
}

function Hopper(opts) {
  const options = {
    defaultFields: true,
    middlewareCreator: middlwares.koa.middlewareCreator,
    formatter: formatJSON,
    handler: defaultHandler,
    ...opts,
  };

  const fields = {};

  if (typeof options.defaultFields === 'boolean' && options.defaultFields) {
    if (options.middlewareCreator === middlwares.koa.middlewareCreator) {
      Object.assign(fields, middlwares.koa.defaultResolvers);
    } else if (options.middlewareCreator === middlwares.express.middlewareCreator) {
      Object.assign(fields, middlwares.express.defaultResolvers);
    }
  }

  const middleware = options.middlewareCreator({
    fields,
    formatter: options.formatter,
    handler: options.handler,
  });

  Object.defineProperty(middleware, 'addField', {
    value: (fieldName, resolver) => {
      fields[fieldName] = resolver;
    },
  });

  return middleware;
}

module.exports = Hopper;
