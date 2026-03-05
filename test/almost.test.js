'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var almost = require('../almost.js');

test('toWordIndex maps maximum uint16 to last list index', function () {
  var index = almost._internal.toWordIndex(65535, 7776);
  assert.equal(index, 7775);
});

test('toWordIndex maps minimum uint16 to first list index', function () {
  var index = almost._internal.toWordIndex(0, 7776);
  assert.equal(index, 0);
});

test('normalizeHowMany clamps and sanitizes input values', function () {
  assert.equal(almost._internal.normalizeHowMany(5000), 1000);
  assert.equal(almost._internal.normalizeHowMany(5.8), 5);
  assert.equal(almost._internal.normalizeHowMany('0'), 1);
  assert.equal(almost._internal.normalizeHowMany(-10), 1);
  assert.equal(almost._internal.normalizeHowMany('abc'), 1);
});
