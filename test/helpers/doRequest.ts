import request from 'supertest';
import Koa from 'koa';
import express from 'express';
import Hopper from '../../src';
// const { TYPE_KOA, TYPE_EXPRESS } = require('../../src/consts');
import { TYPE_KOA, TYPE_EXPRESS } from '../../src/consts';
import { ModuleOptions } from '../../src/Hopper';

async function noop(ctx, next) {
  await next();
}

function expressNoopMiddleware(req, res, next) {
  next();
}

function createExpressServer({ afterMiddleware, handler, ...hopperOpts }) {
  const hopper = Hopper({ type: TYPE_EXPRESS, handler, ...hopperOpts });
  const lastMiddleware = afterMiddleware || expressNoopMiddleware;

  const app = express();
  app.use(hopper);
  app.use(lastMiddleware);
  app.use((req, res) => {
    const response = Buffer.from('Hello World');
    res.setHeader('Content-Length', response.length);
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).end(response);
  });
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.statusCode = 500;
    res.end(err.message);
  });

  return app.listen();
}

function createKoaServer({ afterMiddleware, handler, ...hopperOpts }) {
  const hopper = Hopper({ handler, ...hopperOpts });
  const lastMiddleware = afterMiddleware || noop;

  const app = new Koa();

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = 500;
      ctx.body = err.message;
    }
  });
  app.use(hopper);
  app.use(lastMiddleware);
  app.use((ctx) => {
    ctx.status = 200;
    ctx.body = 'Hello World';
  });

  return app.listen();
}

const createServerOptions = {
  [TYPE_KOA]: createKoaServer,
  [TYPE_EXPRESS]: createExpressServer,
};

export default (typeOrFn) =>
  ({
    status,
    ...rest
  }: { status?: number; afterMiddleware?: typeof expressNoopMiddleware } & Omit<ModuleOptions, 'handler'>): Promise<Record<string, any>> =>
    new Promise((resolve, reject) => {
      let handlerResult;
      const serverOpts = {
        handler: (entry) => {
          handlerResult = entry;
        },
        ...rest,
      };
      const wantedStatus = status || 200;

      let createServer;
      if (typeof typeOrFn === 'function') {
        createServer = typeOrFn;
      } else {
        createServer = createServerOptions[typeOrFn];
      }

      const server = createServer(serverOpts);

      request(server)
        .get('/')
        .expect(wantedStatus)
        .end((err) => {
          if (server.close) {
            server.close();
          }
          if (err) {
            reject(err);
          } else {
            resolve(handlerResult);
          }
        });
    });
