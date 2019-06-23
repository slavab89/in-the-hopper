# In The Hopper

![npm](https://img.shields.io/npm/v/in-the-hopper.svg)
[![Build Status](https://travis-ci.org/slavab89/in-the-hopper.svg?branch=master)](https://travis-ci.org/slavab89/in-the-hopper)
[![Coverage Status](https://coveralls.io/repos/github/slavab89/in-the-hopper/badge.svg?branch=master)](https://coveralls.io/github/slavab89/in-the-hopper?branch=ci)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Node.JS middleware for extracting data from a request and working on it separately - logging, metrics etc.

This library supports both Koa and Express frameworks out-of-the-box. It can, however, work with any other Node.JS http framework.

## Installation

In-the-hopper requires **node v8.3** or higher.

```
npm install in-the-hopper
```

## Usage

For the most basic support, just require and use as a middleware. It will wait for a request to finish and log to stdout a stringified JSON object with basic request/response data.

```js
const hopper = require('in-the-hopper');
app.use(hopper());
```

## API

### Custom fields

The Hopper middleware exposes an `addField` function that allows adding custom fields to the entry that’s sent to the [handler](#handler).
The `addField` function receives a fieldName and a field interpreter

```js
// Koa type
const hopMiddleware = hopper();
hopMiddleware.addField('query', function interpreter(ctx) {
  return ctx.query;
});

// Express type
const hopMiddleware = hopper({ type: 'express' });
hopMiddleware.addField('query', function interpreter(req, res) {
  return req.query;
});
```

### Options

The flow and functionality of the module can be customized by passign an options object on creation.

```js
hopper({
	handler: Function
	type: 'express' OR 'koa'
	defaultFields: Boolean
	immediate: Boolean
	timestamps: Object or Boolean
	ignore: Function
	resolver: Function
	middlewareCreator: Function
})
```

#### type

Default value: `koa`

Allows to specify the type of middleware used internally.
It can be either `koa` or `express`.

For usage with another framework, use [middlewareCreator](#middlewareCreator) option.

#### handler

Default value: `A function that writes a JSON string to stdout.`

Allows to "listen" to the event of a request and do something with the received data.
By default, the handler will be called once the request ends. To trigger the handler once the request arrives, use [immediate](#immediate) option.

```js
hopper({
  handler: function(entry) {
    someLogger.info(entry);
  },
});
```

This is the most common use case which allows handling the given entry by writing it to a log, console, storing it in a cache for metrics etc.
The `entry` parameter is an Object with data from the request and/or response.

#### defaultFields

Default value: `true`

Take out predefined values from the request and response.
The values that are taken are:

- status,
- ip
- method
- url
- contentLength (of response)
- contentType (of response)
- host
- headers (or request)

#### timestamps

Default value: `{ responseTime: true }`

Add timestamps to the entry object that's sent to the [handler](#handler).

Specifying `true` will include both `requestTime` and `responseTime`. Passing an object in the form of `{ requestTime: true, responseTime: true }` is also possible for more control.

#### immediate

Default value: `false`

Calls the [handler](#handler) on request finish instead of on response. Response data will not be available in the handler or field interpreters when this option is turned on.

#### ignore

Default value: `undefined`

Controls if the [handler](#handler) should be triggered or not.
The function should return a boolean value. It is called with the middleware params based on the framework

```js
// Koa type
hopper({
  ignore: ctx => ctx.status === 200,
});
// Express type
hopper({
  type: 'express',
  ignore: (req, res) => res.statusCode === 200,
});
```

#### resolver

Default value: `A function that returns a JSON`

A function that allows more granular control of resolving the fields. In most cases there is no need to use this option.

It should return an object.
It can come handy when you want to pass additional params to the field interpreters.

```js
hopper({
  resolver: (fieldInterpreters, ctx) => {
    const myCustomArg = '';
    const entryObject = Object.entries(fieldInterpreters).reduce((result, [field, interpreter]) => {
      Object.assign(result, { [field]: interpreter(myCustomArg, ...args) });
      return result;
    }, {});
  },
});
```

#### middlewareCreator

Default value: `A function that returns a middleware`

To allow maximum control over the library or when using a different framework, this option will override the whole flow of the module.

This option should be a function that returns a middleware function.
Once passed, it will override what happens during the middleware and all internal logic would need to be activated manually. In most cases there is no need to use this option.

```js
hopper({
  middlewareCreator: opts => {
    /*
		opts is an object of:
		{
			fieldInterpreters,
			resolver,
			handler,
			timestamps,
			immediate,
			ignore,
		}
    */
    return function hapijs(request, h) {
      const entry = resolver(fieldInterpreters, request);
      handler(entry);
    };
  },
});
```

## Examples

### Koa

```js
const Koa = require('koa');
const hopper = require('hopper');

const app = new Koa();
app.use(hopper());
```

### Express

```js
const express = require('express');
const hopper = require('hopper');

const app = express();
app.use(hopper({ type: 'express' }));
```

### Custom field and handler

```js
const Koa = require('koa');
const hopper = require('hopper');

const app = new Koa();
const hopMiddleware = hopper({
	handler: entry => {
		bunyanLog.info(entry);
		winstonLog.info(entry);
		...
	}
});

hopMiddleware.addField('koaState', ctx => ctx.state);

app.use(hopMiddleware));
```
