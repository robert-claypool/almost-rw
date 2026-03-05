'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var crypto = require('node:crypto');
var fs = require('node:fs');
var path = require('node:path');
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

test('extractWordsFromWordlistData parses words from signed file format', function () {
  var data = [
    '-----BEGIN PGP SIGNED MESSAGE-----',
    'Hash: SHA256',
    '',
    'https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases',
    '11111 abacus',
    '11112 abdomen',
    '-----BEGIN PGP SIGNATURE-----',
    '99999 should-not-parse',
  ].join('\n');

  assert.deepEqual(almost._internal.extractWordsFromWordlistData(data), [
    'abacus',
    'abdomen',
  ]);
});

test('hasExpectedWordCount verifies the Diceware list length', function () {
  assert.equal(almost._internal.hasExpectedWordCount(new Array(7776)), true);
  assert.equal(almost._internal.hasExpectedWordCount(['only-one']), false);
});

test('expectedWordlistSha256 matches bundled wordlist file', function () {
  var data = fs.readFileSync(
    path.join(__dirname, '..', 'eff_large_wordlist.asc'),
    'utf8'
  );
  var digest = crypto.createHash('sha256').update(data, 'utf8').digest('hex');

  assert.equal(almost._internal.hasExpectedWordlistHash(digest), true);
  assert.equal(digest, almost._internal.expectedWordlistSha256);
});
