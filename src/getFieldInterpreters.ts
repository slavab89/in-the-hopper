import * as Koa from 'koa';
import * as Express from 'express';
import { TYPE_KOA, TYPE_EXPRESS } from './consts';

function koaResolver(field: keyof Koa.Context): any {
  return (ctx: Koa.Context) => ctx[field];
}

function ipResolver(req: Express.Request) {
  return req.ip || (req.connection && req.connection.remoteAddress) || undefined;
}

function hostResolver(req: Express.Request) {
  return req.hostname || req.headers.host;
}

function requestResolver(field: keyof Express.Request): any {
  return (req: Express.Request) => req[field];
}

function responseHeaderResolver(field: string) {
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

export default ({ type, defaultFields }: { type: string; defaultFields: boolean }) => {
  const fieldResolvers = {};

  if (typeof defaultFields === 'boolean' && defaultFields) {
    if (type === TYPE_KOA) {
      Object.assign(fieldResolvers, koaDefaultResolvers);
    } else if (type === TYPE_EXPRESS) {
      Object.assign(fieldResolvers, expressDefaultResolvers);
    }
  }

  return fieldResolvers;
};
