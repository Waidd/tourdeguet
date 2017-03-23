'use strict';

const Url = require('url');
const imagesBank = require('./imagesBank');
const GLOBALS = require('../globals');

class Item {
  static _extractImage (html) {
    if (!html) { return null; }
    let img = html.match(GLOBALS.IMAGES_PATTERN);

    if (!img || !img[1]) { return null; }
    img = img[1];

    if (!img.match(GLOBALS.IMAGES_FORMAT)) { return null; }

    return img;
  }

  static _findImage (item) {
    let img = item.enclosures.find((enclosure) => enclosure.url.match(GLOBALS.IMAGES_FORMAT));
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
      try {
        image = await imagesBank.get(image, raw.guid);
      } catch (error) {
        console.error('Error during image recuperation.', error);
        image = null;
      }
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
