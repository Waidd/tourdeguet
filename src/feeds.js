'use strict';

const Events = require('events');
const Feed = require('./feed');
const feedsURL = require('../feeds.json');

class Feeds extends Events {
  constructor () {
    super();
    this._initializeFeeds();
  }

  _initializeFeeds () {
    this.feeds = [];

    Object.keys(feedsURL).forEach((feedName) => {
      let feed = new Feed(feedName, feedsURL[feedName]);

      feed.on('meta', (meta) => this.emit('meta', feedName, meta));
      feed.on('error', (err) => this.emit('error', feedName, err));
      feed.on('fetch', (meta) => this.emit('fetch', feedName, meta));
      feed.on('fetched', (items) => this.emit('fetched', feedName, items));
      feed.on('item', (item) => this.emit('item', feedName, item));

      this.feeds.push(feed);
    });
  }

  load () {
    this.feeds.forEach((feed) => feed.load());
  }

  start () {
    this.feeds.forEach((feed) => feed.start());
  }

  stop () {
    this.feeds.forEach((feed) => feed.stop());
  }

  get items () {
    let items = this.feeds.reduce((items, feed) => items.concat(feed.items), []);
    items = items.sort((a, b) => a.date - b.date);
    return items;
  }
}

module.exports = Feeds;
