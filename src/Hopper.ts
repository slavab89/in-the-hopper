import getFieldInterpreters from './getFieldInterpreters';
import getMiddleware from './middlewareCreator';
import { TYPE_OPTIONS, TYPE_KOA } from './consts';
// import Resolver from './globals';

function defaultHandler(entry: object) {
  console.log(JSON.stringify(entry)); // eslint-disable-line no-console
}

// type Resolver2 = (fieldInterpreters: object, ...args: any) => Partial<HopperEntry>;
// var resolveJson2: Resolver;
// declare function Resolver(fieldInterpreters: object, ...args: any): Partial<HopperEntry>;

function resolveJSON(fieldInterpreters: object, ...args: any) {
  const entryObject = Object.entries(fieldInterpreters).reduce((result, [field, interpreter]) => {
    Object.assign(result, { [field]: interpreter(...args) });
    return result;
  }, {});

  return entryObject;
}

function Hopper(opts: ModuleOptions) {
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
    timestamps: { responseTime: true },
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
    timestamps: options.timestamps,
    immediate: options.immediate,
    ignore: options.ignore,
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
    value: (fieldName: string, interpreter: Function) => {
      Object.assign(fieldInterpreters, { [fieldName]: interpreter });
      // fieldInterpreters[fieldName] = interpreter;
    },
  });

  return middleware;
}

export default Hopper;
