'use strict';

const Events = require('events');
const Feed = require('./feed');
const feedsURL = require('../feeds.json');

const FETCH_INTERVAL = 600000;

class Feeds extends Events {
  constructor () {
    super();
    this._initializeFeeds();
    this.enabled = false;
    this.nextLoad = null;
  }

  _initializeFeeds () {
    this.feeds = [];

    Object.keys(feedsURL).forEach((feedName) => {
      let feed = new Feed(feedName, feedsURL[feedName]);
      this.feeds.push(feed);
    });
  }

  async load () {
    this.nextLoad = null;

    for (let i = 0; i < this.feeds.length; i++) {
      const feed = this.feeds[i];
      this.emit('fetch', feed.name);

      const items = await feed.load();
      if (items && items.length) {
        this.emit('fetched', feed.name, items);
      }
    }

    if (!this.enabled) { return; }
    this.nextLoad = setTimeout(this.load.bind(this), FETCH_INTERVAL);
  }

  start () {
    if (this.enabled) { return; }

    this.enabled = true;
    this.load();
  }

  stop () {
    if (!this.enabled) { return; }

    this.enabled = false;
    if (this.nextLoad) {
      clearTimeout(this.nextLoad);
      this.nextLoad = null;
    }
  }

  get items () {
    let items = this.feeds.reduce((items, feed) => items.concat(feed.items), []);
    items = items.sort((a, b) => a.date - b.date);
    return items;
  }
}

module.exports = Feeds;
