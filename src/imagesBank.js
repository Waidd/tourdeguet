'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const fetch = require('node-fetch');
const sharp = require('sharp');
const configuration = require('../configuration.json');
const GLOBALS = require('../globals');
const logger = require('./logger');

class ImagesBank {
  constructor () {
    this.bank = {};
    this.clear();
  }

  clear () {
    fs.readdir(GLOBALS.IMAGES_DIRECTORY, (err, files) => {
      if (err) { throw err; }

      for (const file of files) {
        fs.unlink(path.join(GLOBALS.IMAGES_DIRECTORY, file), err => {
          if (err) { throw err; }
        });
      }
    });
  }

  delete (guid) {
    let filepath = this.bank[guid];

    if (!filepath) {
      logger.warn(`File ${guid} not found.`);
      return;
    }

    fs.unlink(filepath, (err) => {
      if (err) {
        logger.error(`Error while deleting ${guid}.`, err);
      }
    });
  }

  get (url, guid) {
    url = encodeURI(url);
    let filename = crypto.createHash('md5').update(guid).digest('hex') + '.png';
    let filepath = path.resolve(GLOBALS.IMAGES_DIRECTORY, filename);

    return this._fetch(url)
    .then(this._sanitize.bind(this, filepath))
    .then(() => {
      this.bank[guid] = filepath;
      return `${configuration.url}/images/${filename}`;
    })
    .catch((error) => {
      logger.error(`Error while downloading image ${url}. Use default image instead.`, error);
      return null;
    });
  }

  _fetch (url) {
    return fetch(url, { timeout: GLOBALS.FETCH_TIMEOUT })
    .then((res) => {
      if (res.status !== 200) { throw new Error(`Could not load image. Status ${res.status} on ${url}.`); }
      return res.body;
    });
  }

  _sanitize (filepath, stream) {
    return new Promise((resolve, reject) => {
      const resizer = sharp()
      .resize(832, 300)
      .min()
      .withoutEnlargement(true)
      .png()
      .on('error', reject);

      stream
      .pipe(resizer)
      .pipe(fs.createWriteStream(filepath))
      .on('finish', resolve)
      .on('error', reject);
    });
  }
}

module.exports = new ImagesBank();
