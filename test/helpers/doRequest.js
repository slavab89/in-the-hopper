const request = require('supertest');
const Koa = require('koa');
const express = require('express');
const Hopper = require('../../');
const { TYPE_KOA, TYPE_EXPRESS } = require('../../src/consts');

async function noop(ctx, next) {
  await next();
}

function expressNoopMiddleware(req, res, next) {
  next();
}

function createExpressServer({ afterMiddleware, ...hopperOpts }) {
  const hopper = Hopper({ type: TYPE_EXPRESS, ...hopperOpts });
  const lastMiddleware = afterMiddleware || expressNoopMiddleware;

  const app = express();
  app.use(hopper);
  app.use(lastMiddleware);
  app.use((req, res) => {
    const response = Buffer.from('Hello World');
    res.setHeader('Content-Length', response.length);
    res.setHeader('Content-Type', 'text/plain');
    res.end();
  });
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.statusCode = 500;
    res.end(err.message);
  });

  return app;
}

function createKoaServer({ afterMiddleware, ...hopperOpts }) {
  const hopper = Hopper({ ...hopperOpts });
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
  app.use(ctx => {
    ctx.status = 200;
    ctx.body = 'Hello World';
  });

  return app.listen();
}

const createServerOptions = {
  [TYPE_KOA]: createKoaServer,
  [TYPE_EXPRESS]: createExpressServer,
};

module.exports = typeOrFn => ({ status, ...rest } = {}) =>
  new Promise((resolve, reject) => {
    let handlerResult;
    const serverOpts = {
      handler: entry => {
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
      .end(err => {
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
