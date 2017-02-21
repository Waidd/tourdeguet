const request = require('request');
const FeedParser = require('feedparser');
const Events = require('events');
const Url = require('url');

const FECTH_INTERVAL = 300000;
const MAX_ITEMS = 20;
const IMAGE_PATTERN = /<img[^>]+src="?([^"\s]+)"?[^>]*\/>/i;
const IMAGE_FORMAT = /(\.jpe?g)|(\.png)/i;

class Feed extends Events {
  constructor (name, url) {
    super();
    this.name = name;
    this.url = url;
    this.activated = false;
    this.fetching = false;
    this.items = [];
    this.minimumDate = null;
    this.nextFetch;
  }

  _initalizeParser () {
    this.parser = new FeedParser();
    this.newItems = [];

    this.parser.on('error', this.emit.bind(this, 'error'));
    this.parser.on('end', this._destroyParser.bind(this));
    let _onParserReadable = this._onParserReadable.bind(this);
    this.parser.on('readable', function _onParserReadableWrapper () { _onParserReadable(this); });
  }

  _destroyParser () {
    this.parser = null;
    this.fetching = false;

    this._orderItems();

    if (!this.activated) { return; }
    this.nextFetch = setTimeout(this.load.bind(this), FECTH_INTERVAL);
  }

  _orderItems () {
    this.items = this.items.sort((a, b) => a.date - b.date);

    if (!this.newItems.length) { return; }

    let toRemove = this.items.length - MAX_ITEMS;
    if (toRemove > 0) {
      this.items = this.items.slice(toRemove);
    }

    this.minimumDate = this.items[0].date;

    this.emit('fetched', this.newItems);
    this.emit('meta', this.meta);
  }

  _onParserReadable (stream) {
    this.meta = stream.meta;

    while (true) {
      let item = stream.read();
      if (!item) { break; }
      this._pushItem(item);
    }
  }

  _pushItem (item) {
    if (this.minimumDate && item.date < this.minimumDate) { return; }
    if (this.items.find((element) => element.guid === item.guid)) { return; }

    item = this._parseItem(item);
    this.items.push(item);
    this.newItems.push(item);
    this.emit('item', item);
  }

  _extractImage (html) {
    if (!html) { return null; }
    let img = html.match(IMAGE_PATTERN);

    if (!img || !img[1]) { return null; }
    img = img[1];

    if (!img.match(IMAGE_FORMAT)) { return null; }

    return img;
  }

  _findImage (item) {
    let img = item.enclosures.find((enclosure) => enclosure.url.match(IMAGE_FORMAT));

    if (img) { return img.url; }

    return this._extractImage(item.description || item.summary);
  }

  _extractMetaHostname (link) {
    let url = Url.parse(link);
    return url.hostname;
  }

  _parseItem (item) {
    return {
      guid: item.guid,
      title: item.title,
      image: this._findImage(item),
      date: item.date,
      link: item.origlink || item.link,
      categories: item.categories,
      meta: {
        title: item.meta.title || this._extractMetaHostname(item.meta.link),
        link: item.meta.link
      }
    };
  }

  _onRequestResponse (res, stream) {
    if (res.statusCode !== 200) { return stream.emit('error', new Error('Bad status code')); }
    stream.pipe(this.parser);
  }

  _executeRequest () {
    let req = request(this.url);

    req.on('error', this.emit.bind(this, 'error'));
    let _onRequestResponse = this._onRequestResponse.bind(this);
    req.on('response', function _onRequestResponseWrapper (res) { _onRequestResponse(res, this); });
  }

  load () {
    if (this.fetching) { return; }

    this.emit('fetch');
    this._initalizeParser();
    this.fetching = true;
    this._executeRequest();
  }

  start () {
    this.activated = true;
    this.load();
  }

  stop () {
    if (this.nextFetch) {
      clearTimeout(this.nextFetch);
      this.nextFetch = null;
    }

    this.activated = false;
    this.fetching = false;
  }
}

module.exports = Feed;
