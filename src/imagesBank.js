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

  download (url, guid) {
    let filename = crypto.createHash('md5').update(guid).digest('hex') + '.png';
    let filepath = path.resolve(IMAGES_DIRECTORY, filename);

    return new Promise((resolve) => {
      const resizer = sharp()
      .resize(832, 300)
      .min()
      .withoutEnlargement(true)
      .png()
      .on('error', (err) => {
        console.log('could not treat image', url, err);
        resolve(null);
      });

      fetch(url)
      .then((res) => {
        if (res.status !== 200) { throw new Error('could not load image'); }
        return res.body;
      }).then((stream) => {
        stream
        .pipe(resizer)
        .pipe(fs.createWriteStream(filepath))
        .on('finish', () => {
          this.bank[guid] = filepath;
          resolve(`${configuration.url}/${filename}`);
        })
        .on('error', (err) => {
          console.log('could not treat image', url, err);
          resolve(null);
        });
      })
      .catch((error) => {
        console.error(error);
        resolve(null);
      });
    });
  }
}

module.exports = new ImagesBank();
