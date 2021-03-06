'use strict';

const path = require('path');

module.exports = {
  IMAGES_DIRECTORY: path.resolve(__dirname, 'images'),
  IMAGES_PATTERN: /<img[^>]+src="?([^"\s]+)"?[^>]*\/>/i,
  IMAGES_FORMAT: /(\.jpe?g)|(\.png)/i,
  MAX_STORED_ITEMS_BY_FEED: 20,
  MAX_SENDED_ITEMS: 25,
  // @TODO we should have a faster / longer fetching interval if a client is connected or not
  FEED_FETCH_COOLDOWN: 10 * 60 * 1000,
  FETCH_TIMEOUT: 20 * 1000
};
