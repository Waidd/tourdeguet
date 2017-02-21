'use strict';

const WebSocket = require('ws');
const Feeds = require('./feeds');

class App {
  constructor () {
    this.feeds = new Feeds();
  }

  start () {
    this.feeds.on('error', (name, err) => console.error(name, err));
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

    this.server = new WebSocket.Server({port: 8080});
    console.log('listen on port 8080');
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
