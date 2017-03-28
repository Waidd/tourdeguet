const fetch = require('node-fetch');
const FeedParser = require('feedparser');
const Item = require('./item');
const GLOBALS = require('../globals');
const logger = require('./logger');

class Feed {
  constructor (name, url) {
    this.name = name;
    this.url = url;
    this.fetching = false;
    this.items = [];
    this.newItems = [];
    this.parsingPromises = [];
    this.minimumDate = null;
  }

  async load () {
    if (this.fetching) { return; }
    this.fetching = true;

    try {
      const stream = await this._get();
      await this._parse(stream);
      await Promise.all(this.parsingPromises);
      this._sort();
    } catch (e) {
      logger.error('Error while loading a feed.', e);
    }

    this.fetching = false;
    return this.newItems;
  }

  _parse (stream) {
    return new Promise((resolve, reject) => {
      const parser = new FeedParser();
      this.newItems = [];
      this.parsingPromises = [];

      parser.on('error', reject);
      parser.on('end', resolve);

      let _onParserReadable = this._onParserReadable.bind(this);
      parser.on('readable', function _onParserReadableWrapper () { _onParserReadable(this); });

      stream.pipe(parser);
    });
  }

  _sort () {
    if (!this.newItems.length) { return; }

    this.items.sort((a, b) => b.date - a.date).slice(0, GLOBALS.MAX_STORED_ITEMS_BY_FEED);
    this.minimumDate = this.items[0].date;
  }

  _onParserReadable (stream) {
    this.parsingPromises.push(new Promise(async (resolve) => {
      let item;

      while ((item = stream.read())) {
        await this._pushItem(item);
      }

      resolve();
    }));
  }

  async _pushItem (item) {
    if (this.minimumDate && item.date < this.minimumDate) { return; }
    if (this.items.find((element) => element.guid === item.guid)) { return; }

    item = await Item.parse(item);

    this.items.push(item);
    this.newItems.push(item);
  }

  _get () {
    return fetch(this.url, { timeout: GLOBALS.FETCH_TIMEOUT })
    .then((res) => {
      if (res.status !== 200) { throw new Error('Bad status code'); }
      return res.body;
    });
  }
}

module.exports = Feed;
