const { expect } = require('chai');
const http = require('http');
const faker = require('faker');
const lolex = require('lolex');
const Hopper = require('../');
const createKoaCtx = require('./helpers/koaContext');
const doRequestWrapper = require('./helpers/doRequest');

function noop() {}

function createKoaServer({ afterMiddleware, ...hopperOpts }) {
  const hopper = Hopper({ ...hopperOpts });
  const lastMiddleware = afterMiddleware || noop;

  return http.createServer(async (req, res) => {
    const ctx = createKoaCtx(req, res);

    try {
      await hopper(ctx, lastMiddleware);
      res.end();
    } catch (err) {
      res.statusCode = 500;
      res.end(err.message);
    }
  });
}

const doRequest = doRequestWrapper(createKoaServer);

describe('Koa related', () => {
  it('should use default koa options', async () => {
    const entry = await doRequest();
    expect(entry).to.have.all.keys([
      'responseTime',
      'status',
      'ip',
      'method',
      'url',
      'contentLength',
      'contentType',
      'host',
      'headers',
    ]);
  });

  it('should have some response data in handler', async () => {
    const entry = await doRequest();
    expect(entry).to.have.property('status', 200);
    expect(entry).to.have.property('method', 'GET');
  });

  it('should call resolver with koa context param', async () => {
    const resolver = (fields, ...args) => {
      expect(args).to.have.lengthOf(1);
      const ctx = args[0];
      expect(ctx.req).to.be.an.instanceOf(http.IncomingMessage);
      expect(ctx.res).to.be.an.instanceOf(http.ServerResponse);

      return {};
    };

    await doRequest({ resolver });
  });

  it('should call handler without any fields when defaultFields is false', async () => {
    const entry = await doRequest({ defaultFields: false });
    expect(entry).to.have.all.keys(['responseTime']);
  });

  it('should record responseTime based on default options', async () => {
    const fakeTime = faker.random.number();
    const responseTime = 2000;
    const clock = lolex.install({ now: fakeTime, toFake: ['Date'] });

    const afterMiddleware = async () => {
      clock.tick(responseTime);
    };

    const entry = await doRequest({ afterMiddleware });
    expect(entry).to.have.own.property('responseTime', responseTime);
    expect(entry).to.not.have.own.property('requestTime');

    clock.uninstall();
  });

  it('should record responseTime when option passed', async () => {
    const fakeTime = faker.random.number();
    const responseTime = 2000;
    const clock = lolex.install({ now: fakeTime, toFake: ['Date'] });

    const afterMiddleware = () => {
      clock.tick(responseTime);
    };

    const entry = await doRequest({ afterMiddleware, timestamps: { responseTime: true } });
    expect(entry).to.have.own.property('responseTime', responseTime);
    clock.uninstall();
  });

  it('should record requestTime when option passed', async () => {
    const fakeTime = faker.random.number();
    const clock = lolex.install({ now: fakeTime, toFake: ['Date'] });

    const entry = await doRequest({ timestamps: { requestTime: true } });
    expect(entry).to.have.own.property('requestTime', fakeTime);
    clock.uninstall();
  });

  it('should record both times when option passed', async () => {
    const fakeTime = faker.random.number();
    const responseTime = 2000;
    const clock = lolex.install({ now: fakeTime, toFake: ['Date'] });

    const afterMiddleware = () => {
      clock.tick(responseTime);
    };

    const entry = await doRequest({ afterMiddleware, timestamps: true });
    expect(entry).to.have.own.property('requestTime', fakeTime);
    expect(entry).to.have.own.property('responseTime', responseTime);
    clock.uninstall();
  });

  it('should not record times if option disabled', async () => {
    const entry = await doRequest({ timestamps: false });
    expect(entry).to.not.have.own.property('requestTime');
    expect(entry).to.not.have.own.property('responseTime');
  });

  it('should still call handler when exception occurs', async () => {
    const afterMiddleware = () => {
      throw new Error('FAIL');
    };

    const entry = await doRequest({ status: 500, afterMiddleware });
    expect(entry.status).to.equal(500);
  });

  it('should immediattely invoke koa handler before finishing request', async () => {
    const entry = await doRequest({ immediate: true });
    expect(entry).to.not.have.property('responseTime');
  });

  it('should ignore based result from function', async () => {
    const ignore = () => true;

    const entry = await doRequest({ ignore });
    expect(entry).to.equal(undefined);
  });

  it('should pass relevant fields to ignore function', async () => {
    const ignore = ctx => {
      expect(ctx.req).to.be.an.instanceOf(http.IncomingMessage);
      expect(ctx.res).to.be.an.instanceOf(http.ServerResponse);
      return true;
    };

    const entry = await doRequest({ ignore });
    expect(entry).to.equal(undefined);
  });
});
