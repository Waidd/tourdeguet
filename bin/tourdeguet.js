#!/usr/bin/env node
'use strict';

const App = require('../src/app.js');

let app = new App();
app.start();

module.exports = app;
