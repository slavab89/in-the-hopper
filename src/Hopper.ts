import { Middleware } from 'koa';
import getFieldInterpreters from './getFieldInterpreters';
import getMiddleware from './middlewareCreator';
import { ServerType } from './consts';
import {
  ExpressFieldResolver,
  ExpressMiddleware,
  FieldInterpreters,
  Handler,
  HopperOptions,
  KoaFieldResolver,
  Resolver,
  TimestampOptions,
} from './types';

export interface ModuleOptions {
  handler?: typeof Handler;
  type?: ServerType | string;
  defaultFields?: boolean;
  immediate?: boolean;
  timestamps?: boolean | Readonly<TimestampOptions>;
  ignore?: (...args: any) => boolean;
  resolver?: typeof Resolver;
  middlewareCreator?: (opts: HopperOptions) => Middleware | ExpressMiddleware;
}

function defaultHandler(entry: object) {
  console.log(JSON.stringify(entry)); // eslint-disable-line no-console
}

function resolveJSON(fieldInterpreters: FieldInterpreters, ...args: any) {
  const entryObject = Object.entries(fieldInterpreters).reduce((result, [field, interpreter]) => {
    // @ts-ignore
    Object.assign(result, { [field]: interpreter(...args) });
    return result;
  }, {});

  return entryObject;
}

export function Hopper<T>(opts: ModuleOptions) {
  if (opts.type && opts.middlewareCreator) {
    throw new Error('Cant use both type and middlewareCreator options, please only send one');
  }

  if (opts.type && !Object.values(ServerType).includes(opts.type as ServerType)) {
    throw new TypeError(`type can be one of ${Object.values(ServerType)}`);
  }

  if (opts.middlewareCreator && typeof opts.middlewareCreator !== 'function') {
    throw new TypeError('middlewareCreator should be a function');
  }

  const options = {
    defaultFields: true,
    type: ServerType.Koa,
    immediate: false,
    timestamps: { responseTime: true },
    resolver: resolveJSON,
    handler: defaultHandler,
    ...opts,
  };

  const fieldInterpreters: FieldInterpreters = {};
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
    value: (fieldName: string, interpreter: KoaFieldResolver | ExpressFieldResolver) => {
      Object.assign(fieldInterpreters, { [fieldName]: interpreter });
    },
  });

  return middleware;
}
