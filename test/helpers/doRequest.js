const request = require('supertest');

module.exports = createServer => ({ status, ...rest } = {}) =>
  new Promise((resolve, reject) => {
    let handlerResult;
    const serverOpts = {
      handler: entry => {
        handlerResult = entry;
      },
      ...rest,
    };
    const wantedStatus = status || 200;

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
