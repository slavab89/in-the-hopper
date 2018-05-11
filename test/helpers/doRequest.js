const http = require('http');
const request = require('supertest');
const Hopper = require('../../');
const createKoaCtx = require('./koaContext');
const { TYPE_KOA, TYPE_EXPRESS } = require('../../src/consts');

function noop() {}

function expressNoopMiddleware(req, res, next) {
  next();
}

function createExpressServer({ afterMiddleware, ...hopperOpts }) {
  const hopper = Hopper({ type: TYPE_EXPRESS, ...hopperOpts });
  const lastMiddleware = afterMiddleware || expressNoopMiddleware;

  return http.createServer((req, res) => {
    hopper(req, res, () => {
      lastMiddleware(req, res, err => {
        if (err) {
          res.statusCode = 500;
          res.end(err.message);
        } else {
          res.end();
        }
      });
    });
  });
}

function createKoaServer({ afterMiddleware, ...hopperOpts }) {
  const hopper = Hopper({ ...hopperOpts });
  const lastMiddleware = afterMiddleware || noop;

  return http.createServer(async (req, res) => {
    const ctx = createKoaCtx(req, res);

    try {
      await hopper(ctx, lastMiddleware.bind(null, ctx, noop));
      res.end();
    } catch (err) {
      res.statusCode = 500;
      res.end(err.message);
    }
  });
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

    request(createServer(serverOpts))
      .get('/')
      .expect(wantedStatus)
      .end(err => {
        if (err) {
          reject(err);
        } else {
          resolve(handlerResult);
        }
      });
  });
