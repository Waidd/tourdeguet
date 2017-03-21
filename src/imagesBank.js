'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const fetch = require('node-fetch');
const sharp = require('sharp');
const configuration = require('../configuration.json');

const IMAGES_DIRECTORY = path.resolve(__dirname, '../images');

class ImagesBank {
  constructor () {
    this.bank = {};
    this.clear();
  }

  clear () {
    fs.readdir(IMAGES_DIRECTORY, (err, files) => {
      if (err) { throw err; }

      for (const file of files) {
        fs.unlink(path.join(IMAGES_DIRECTORY, file), err => {
          if (err) { throw err; }
        });
      }
    });
  }

  delete (guid) {
    let filepath = this.bank[guid];

    if (!filepath) {
      console.warn(`File ${guid} not found.`);
      return;
    }

    fs.unlink(filepath, (err) => {
      if (err) { console.error(err); }
    });
  }

  get (url, guid) {
    url = encodeURI(url);
    let filename = crypto.createHash('md5').update(guid).digest('hex') + '.png';
    let filepath = path.resolve(IMAGES_DIRECTORY, filename);

    return this._fetch(url)
    .then(this._sanitize.bind(this, filepath))
    .then(() => {
      this.bank[guid] = filepath;
      return `${configuration.url}/images/${filename}`;
    })
    .catch((error) => {
      console.error(`Error while downloading image ${url}.`, error);
      return null;
    });
  }

  _fetch (url) {
    return fetch(url)
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
