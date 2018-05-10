const getFieldResolvers = require('./getFieldResolvers');
const getMiddleware = require('./middlewareCreator');
const { TYPE_OPTIONS, TYPE_KOA } = require('./consts');

function defaultHandler(message) {
  console.log(JSON.stringify(message)); // eslint-disable-line no-console
}

function formatJSON(fieldResolvers, ...args) {
  const entryObject = Object.entries(fieldResolvers).reduce((result, [field, resolver]) => {
    Object.assign(result, { [field]: resolver(...args) });
    return result;
  }, {});

  return entryObject;
}

function Hopper(opts = {}) {
  if (opts.type && opts.middlewareCreator) {
    throw new Error('Cant use both type and middlewareCreator options, please only send one');
  }

  if (opts.type && !TYPE_OPTIONS.includes(opts.type)) {
    throw new TypeError(`type can be one of ${TYPE_OPTIONS}`);
  }

  if (opts.middlewareCreator && typeof opts.middlewareCreator !== 'function') {
    throw new TypeError('middlewareCreator should be a function');
  }

  const options = {
    defaultFields: true,
    type: TYPE_KOA,
    formatter: formatJSON,
    handler: defaultHandler,
    ...opts,
  };

  const fieldResolvers = {};
  if (!options.middlewareCreator) {
    Object.assign(
      fieldResolvers,
      getFieldResolvers({
        type: options.type,
        defaultFields: options.defaultFields,
      }),
    );
  }

  const middlewareOpts = {
    fieldResolvers,
    formatter: options.formatter,
    handler: options.handler,
  };
  const middleware = getMiddleware(
    {
      middlewareCreator: options.middlewareCreator,
      type: options.type,
    },
    middlewareOpts,
  );

  if (typeof middleware !== 'function') {
    throw new TypeError('middlewareCreator should return a function');
  }

  Object.defineProperty(middleware, 'addField', {
    value: (fieldName, resolver) => {
      fieldResolvers[fieldName] = resolver;
    },
  });

  return middleware;
}

module.exports = Hopper;
