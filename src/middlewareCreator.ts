import onFinished from 'on-finished';
import { Context, Next, Middleware } from 'koa';
import { NextFunction, Request, Response } from 'express';
import { IncomingMessage, OutgoingMessage } from 'http';
import { ServerType } from './consts';
import { ExpressMiddleware, HMiddleware, HopperOptions } from './types';

// type KoaMiddleware = (ctx: Context, next: Next) => Promise<void>;

type RequestWrapper = <T extends IncomingMessage | OutgoingMessage>(
  requestTime: number,
  ...args: any
) => (err?: Error | null, msg?: T) => void;

const onRequestWrapper =
  ({
    fieldInterpreters,
    resolver,
    handler,
    timestamps,
    immediate,
    ignore,
  }: Required<Omit<HopperOptions, 'ignore'>> & { ignore?: (...args: any) => boolean }): RequestWrapper =>
  (requestTime: number, ...args: any) =>
    function onRequestHandler(): void {
      if (typeof ignore === 'function' && ignore(...args)) {
        return;
      }

      const responseTime = Date.now() - requestTime;
      const entry = resolver(fieldInterpreters, ...args);

      if (timestamps) {
        if ((typeof timestamps === 'object' && timestamps.requestTime === true) || timestamps === true) {
          entry.requestTime = requestTime;
        }
        if (!immediate && ((typeof timestamps === 'object' && timestamps.responseTime === true) || timestamps === true)) {
          entry.responseTime = responseTime;
        }
      }

      Object.keys(entry).forEach((key) => entry[key] === undefined && delete entry[key]);

      handler(entry);
    };

const triggerHandlerWrapper =
  ({ onRequestHandler, immediate }: { onRequestHandler: RequestWrapper; immediate: boolean }) =>
  <T extends IncomingMessage | OutgoingMessage>(res: T) =>
  (...args: any) => {
    const requestTime = Date.now();
    const requestHandler = onRequestHandler(requestTime, ...args);
    if (immediate) {
      requestHandler();
    } else {
      onFinished(res, requestHandler);
    }
  };

const koaMiddlewareWrapper =
  (triggerHandler: Function): Middleware =>
  async (ctx: Context, next: Function) => {
    triggerHandler(ctx.res)(ctx);
    await next();
  };

const expressMiddlewareWrapper =
  (triggerHandler: Function): ExpressMiddleware =>
  (req: Request, res: Response, next: Function) => {
    // Trigger cache getter ip because later it will be undefined
    req.ip; // eslint-disable-line @typescript-eslint/no-unused-expressions
    triggerHandler(res)(req, res);
    next();
  };

export default (
  { middlewareCreator, type }: { middlewareCreator?: (opts: HopperOptions) => HMiddleware; type?: string },
  middlewareOpts: Required<Omit<HopperOptions, 'ignore'>> & { ignore?: (...args: any) => boolean },
): HMiddleware => {
  let middleware;

  if (middlewareCreator) {
    middleware = middlewareCreator(middlewareOpts);
  } else {
    const onRequestHandler = onRequestWrapper(middlewareOpts);
    const triggerHandler = triggerHandlerWrapper({
      onRequestHandler,
      immediate: !!middlewareOpts.immediate,
    });

    if (type === ServerType.Koa) {
      middleware = koaMiddlewareWrapper(triggerHandler);
    } else if (type === ServerType.Express) {
      middleware = expressMiddlewareWrapper(triggerHandler);
    }
  }

  return middleware as HMiddleware;
};
