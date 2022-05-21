import * as Koa from 'koa';
import * as Express from 'express';
import { ServerType } from './consts';
import { ExpressFieldResolver, FieldInterpreters, KoaFieldResolver } from './types';

function koaResolver(field: keyof Koa.Context): KoaFieldResolver {
  return (ctx: Koa.Context) => ctx[field];
}

function ipResolver(req: Express.Request) {
  return req.ip || (req.socket && req.socket.remoteAddress) || undefined;
}

function hostResolver(req: Express.Request) {
  return req.hostname || req.headers.host;
}

function requestResolver(field: keyof Express.Request): ExpressFieldResolver {
  return (req: Express.Request) => req[field];
}

function responseHeaderResolver(field: string): ExpressFieldResolver {
  return (_req: Express.Request, res: Express.Response) => {
    if (!res.headersSent) {
      return undefined;
    }

    const header = res.getHeader(field);

    return Array.isArray(header) ? header.join(', ') : header;
  };
}

const koaDefaultResolvers = {
  status: koaResolver('status'),
  ip: koaResolver('ip'),
  method: koaResolver('method'),
  url: koaResolver('url'),
  contentLength: koaResolver('length'),
  contentType: koaResolver('type'),
  host: koaResolver('host'),
  headers: koaResolver('headers'),
};

const expressDefaultResolvers = {
  status: (_req: Express.Request, res: Express.Response) => res.statusCode,
  ip: ipResolver,
  method: requestResolver('method'),
  url: requestResolver('url'),
  contentLength: responseHeaderResolver('content-length'),
  contentType: responseHeaderResolver('content-type'),
  host: hostResolver,
  headers: requestResolver('headers'),
};

export default ({ type, defaultFields }: { type: ServerType | string; defaultFields: boolean }): FieldInterpreters => {
  const fieldResolvers = {};

  if (typeof defaultFields === 'boolean' && defaultFields) {
    if (type === ServerType.Koa) {
      Object.assign(fieldResolvers, koaDefaultResolvers);
    } else if (type === ServerType.Express) {
      Object.assign(fieldResolvers, expressDefaultResolvers);
    }
  }

  return fieldResolvers;
};
