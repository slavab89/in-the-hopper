const getFieldInterpreters = require('./getFieldInterpreters');
const getMiddleware = require('./middlewareCreator');
const { TYPE_OPTIONS, TYPE_KOA } = require('./consts');

function defaultHandler(entry) {
  console.log(JSON.stringify(entry)); // eslint-disable-line no-console
}

function resolveJSON(fieldInterpreters, ...args) {
  const entryObject = Object.entries(fieldInterpreters).reduce((result, [field, interpreter]) => {
    Object.assign(result, { [field]: interpreter(...args) });
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
    immediate: false,
    resolver: resolveJSON,
    handler: defaultHandler,
    ...opts,
  };

  const fieldInterpreters = {};
  if (!options.middlewareCreator) {
    Object.assign(
      fieldInterpreters,
      getFieldInterpreters({
        type: options.type,
        defaultFields: options.defaultFields,
      }),
    );
  }

  const middlewareOpts = {
    fieldInterpreters,
    resolver: options.resolver,
    handler: options.handler,
    immediate: options.immediate,
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
    value: (fieldName, interpreter) => {
      fieldInterpreters[fieldName] = interpreter;
    },
  });

  return middleware;
}

module.exports = Hopper;
