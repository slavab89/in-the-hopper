const http = require('http');
const { expect } = require('chai');
const faker = require('faker');
const Hopper = require('../');
const doRequestWrapper = require('./helpers/doRequest');

const noop = () => {};

const middlewareCreator = ({ fieldInterpreters, resolver, handler }) => (req, res) => {
  const entry = resolver(fieldInterpreters, req, res);
  handler(entry);
};

describe('Hopper functionality', () => {
  let hopperInstance;
  let doRequest;

  beforeEach(() => {
    doRequest = doRequestWrapper(hopperOpts => {
      hopperInstance = Hopper({ ...hopperOpts });

      return http.createServer(async (req, res) => {
        try {
          await hopperInstance(req, res, noop);
          res.end();
        } catch (err) {
          res.statusCode = 500;
          res.end(err.message);
        }
      });
    });
  });

  it('should validate that middlewareCreator is a function', () => {
    expect(() => Hopper({ middlewareCreator: {} })).to.throw(TypeError, 'should be a function');
  });

  it('should validate that only type or middleware creator are sent', () => {
    expect(() => Hopper({ middlewareCreator: noop, type: 'koa' })).to.throw(
      Error,
      'Cant use both type and middlewareCreator',
    );
  });

  it('should validate that middlewareCreator returns a function', () => {
    const midCreator = () => ({});
    expect(() => Hopper({ middlewareCreator: midCreator })).to.throw(
      TypeError,
      'should return a function',
    );
  });

  it('should validate that type is one of predefined', () => {
    expect(() => Hopper({ type: 'else' })).to.throw(TypeError, 'type can be one of');
  });

  it('should pass relevant options to middleware creator', async () => {
    const handler = noop;
    const resolver = noop;
    const midCreator = opts => {
      expect(opts).to.have.all.keys([
        'fieldInterpreters',
        'resolver',
        'handler',
        'immediate',
        'timestamps',
      ]);
      expect(opts.fieldInterpreters).to.be.a('object');
      expect(opts.resolver).to.equal(resolver);
      expect(opts.handler).to.equal(handler);
      expect(opts.immediate).to.equal(false);

      return noop;
    };
    const hopper = Hopper({ handler, resolver, middlewareCreator: midCreator });
    hopper();
  });

  it('should invoke handler with a default json empty object given custom middleware', async () => {
    const entry = await doRequest({ middlewareCreator });
    expect(entry).to.be.a('object');
    expect(entry).to.deep.equal({});
  });

  it('should add a custom field', async () => {
    const rKey = faker.random.objectElement();
    const rValue = faker.random.word();

    const promise = doRequest({ middlewareCreator });
    hopperInstance.addField(rKey, () => rValue);
    const entry = await promise;
    expect(entry).to.deep.equal({ [rKey]: rValue });
  });

  it('should invoke resolver with valid params', async () => {
    const rKey = faker.random.objectElement();
    const rValue = faker.random.word();
    const resolverr = () => rValue;
    const resolver = (fieldInterpreters, req, res) => {
      expect(fieldInterpreters).to.deep.equal({ [rKey]: resolverr });
      expect(req).to.be.an.instanceOf(http.IncomingMessage);
      expect(res).to.be.an.instanceOf(http.ServerResponse);

      return {};
    };

    const promise = doRequest({ middlewareCreator, resolver });
    hopperInstance.addField(rKey, resolverr);
    await promise;
  });

  it('should invoke handler with data from custom resolver', async () => {
    const fakeFormat = faker.helpers.createTransaction();

    const resolver = () => fakeFormat;
    const entry = await doRequest({ middlewareCreator, resolver });
    expect(entry).to.deep.equal(fakeFormat);
  });
});
