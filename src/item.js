'use strict';

const Url = require('url');
const imagesBank = require('./imagesBank');

const IMAGE_PATTERN = /<img[^>]+src="?([^"\s]+)"?[^>]*\/>/i;
const IMAGE_FORMAT = /(\.jpe?g)|(\.png)/i;

class Item {
  static _extractImage (html) {
    if (!html) { return null; }
    let img = html.match(IMAGE_PATTERN);

    if (!img || !img[1]) { return null; }
    img = img[1];

    if (!img.match(IMAGE_FORMAT)) { return null; }

    return img;
  }

  static _findImage (item) {
    let img = item.enclosures.find((enclosure) => enclosure.url.match(IMAGE_FORMAT));
    if (img) { return img.url; }

    return this._extractImage(item.description || item.summary);
  }

  static _extractMetaHostname (link) {
    let url = Url.parse(link);
    return url.hostname;
  }

  static async parse (raw) {
    let image = this._findImage(raw);

    if (image) {
      image = await imagesBank.download(image, raw.guid);
    }

    return {
      guid: raw.guid,
      title: raw.title,
      image: image,
      date: raw.date,
      link: raw.origlink || raw.link,
      categories: raw.categories,
      meta: {
        title: raw.meta.title || this._extractMetaHostname(raw.meta.link),
        link: raw.meta.link
      }
    };
  }
}

module.exports = Item;
