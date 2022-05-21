import { Request, Response, NextFunction } from 'express';
import { Context, Middleware } from 'koa';

type HopperEntry = {
  status?: number;
  ip?: string;
  method?: string | undefined;
  url?: string;
  contentLength?: number;
  contentType?: string;
  host?: string;
  headers?: object;
  requestTime?: number;
  responseTime?: number;
  [key: string]: any;
};

export type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export type HMiddleware = Middleware | ExpressMiddleware;

export type KoaFieldResolver = (ctx: Context) => any;
export type ExpressFieldResolver = (req: Request, res: Response) => any;

export type FieldInterpreters = Record<string, KoaFieldResolver | ExpressFieldResolver>;

export declare function Resolver(fieldInterpreters: FieldInterpreters, ...args: any): Partial<HopperEntry>;
// declare function resolveJSON(fieldInterpreters: object, ...args: any): Partial<HopperEntry>;

export declare function Handler(entry: Partial<HopperEntry>): void;

export interface TimestampOptions {
  requestTime?: boolean;
  responseTime?: boolean;
}

export interface HopperOptions {
  fieldInterpreters?: Record<string, KoaFieldResolver | ExpressFieldResolver>;
  timestamps?: boolean | Readonly<TimestampOptions>;
  immediate?: boolean;
  resolver?: typeof Resolver;
  handler: typeof Handler;
  ignore?: (...args: any) => boolean;
}
