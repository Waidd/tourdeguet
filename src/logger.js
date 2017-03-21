'use strict';

const winston = require('winston');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: process.env.LOG_LEVEL || 'verbose',
      timestamp: () => (new Date()).toJSON(),
      formatter: (options) => {
        const timestamp = options.timestamp();
        const level = options.level.toUpperCase();
        const message = options.message || '';
        const meta = options.meta && Object.keys(options.meta).length ? `\n${JSON.stringify(options.meta, null, 2)}` : '';

        return `${timestamp} ${level} ${message} ${meta}`;
      }
    })
  ]
});

module.exports = logger;
