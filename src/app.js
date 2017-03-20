'use strict';

const express = require('express');
const path = require('path');
const Feeds = require('./feeds');

class App {
  start () {
    this._startHTTPServer();
    this._startFeeds();
  }

  _startFeeds () {
    this.feeds = new Feeds();
    this.feeds.on('fetch', (name) => console.log('fetch', name));
    this.feeds.on('fetched', (name, items) => {
      console.log('fetched', name, items.length);

      this.clients.forEach((client) => {
        client.write(`data: ${JSON.stringify(items)}\n\n`);
      });
    });

    this.feeds.start();
  }

  _startHTTPServer () {
    this.app = express();

    this.app.use('/images', express.static(path.join(__dirname, '../images')));

    this.clients = [];
    this.app.get('/stream/items', (req, res) => {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(`data: ${JSON.stringify(this.feeds.items)}\n\n`);

      this.clients.push(res);
      const _popClient = () => {
        let index = this.clients.indexOf(res);
        if (!~index) { return; }
        this.clients.splice(index, 1);
      };
      req.on('close', _popClient);
      req.on('end', _popClient);
    });

    this.app.listen(8081, function () {
      console.log('Listening http on port 8081');
    });
  }
}

module.exports = App;
