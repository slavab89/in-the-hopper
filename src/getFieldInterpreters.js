const { TYPE_KOA, TYPE_EXPRESS } = require('./consts');

function koaResolver(field) {
  return ctx => ctx[field];
}

function ipResolver(req) {
  return req.ip || (req.connection && req.connection.remoteAddress) || undefined;
}

function hostResolver(req) {
  return req.hostname || req.headers.host;
}

function requestResolver(field) {
  return req => req[field];
}

function responseHeaderResolver(field) {
  return (req, res) => {
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
  status: (req, res) => res.statusCode,
  ip: ipResolver,
  method: requestResolver('method'),
  url: requestResolver('url'),
  contentLength: responseHeaderResolver('content-length'),
  contentType: responseHeaderResolver('content-type'),
  host: hostResolver,
  headers: requestResolver('headers'),
};

module.exports = ({ type, defaultFields }) => {
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
