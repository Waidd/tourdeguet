'use strict';

const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const Feeds = require('./feeds');

class App {
  start () {
    this._startHTTPServer();
    this._startWebsocketSever();
    this._startFeeds();
  }

  _startFeeds () {
    this.feeds = new Feeds();
    this.feeds.on('fetch', (name) => console.log('fetch', name));
    this.feeds.on('fetched', (name, items) => {
      console.log('fetched', name, items.length);
      this.server.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) { return; }
        client.send(JSON.stringify({
          type: 'update',
          items: items
        }));
      });
    });

    this.feeds.start();
  }

  _startHTTPServer () {
    this.app = express();

    this.app.use(express.static(path.join(__dirname, '../images')));
    this.app.listen(8081, function () {
      console.log('Listening http on port 8081');
    });
  }

  _startWebsocketSever () {
    this.server = new WebSocket.Server({port: 8080});
    console.log('Listening websockets on port 8080');
    this.server.on('connection', this._onClientConnection.bind(this));
  }

  _onClientConnection (client) {
    console.log('incomming connection');

    client.on('message', this._onClientMessage.bind(this, client));

    client.send(JSON.stringify({
      type: 'entries',
      items: this.feeds.items
    }));
  }

  _onClientMessage (client, message) {
    try {
      message = JSON.parse(message);
      this._handleClientMessage(client, message);
    } catch (e) {
      console.log('incoming message error', e);
    }
  }

  _handleClientMessage (client, message) {
    if (message.type === 'ping') {
      client.send(JSON.stringify({
        type: 'pong'
      }));
    }
  }
}

module.exports = App;
