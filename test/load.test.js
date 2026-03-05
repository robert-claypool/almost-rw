'use strict';

var assert = require('node:assert/strict');
var crypto = require('node:crypto');
var fs = require('node:fs');
var path = require('node:path');
var test = require('node:test');

var wordlistData = fs.readFileSync(
  path.join(__dirname, '..', 'eff_large_wordlist.asc'),
  'utf8'
);

function bufferToArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function buildWindowCrypto() {
  return {
    subtle: {
      digest: function (algorithm, data) {
        var digest = crypto
          .createHash('sha256')
          .update(Buffer.from(data))
          .digest();

        assert.equal(algorithm, 'SHA-256');
        return Promise.resolve(bufferToArrayBuffer(digest));
      },
    },
    getRandomValues: function (arr) {
      var i;
      for (i = 0; i < arr.length; i++) {
        arr[i] = i % 65536;
      }
      return arr;
    },
  };
}

function buildMockXMLHttpRequest(responses, counter) {
  var callIndex = 0;

  function MockXMLHttpRequest() {
    this._response = responses[callIndex] || responses[responses.length - 1];
    callIndex += 1;
    counter.count += 1;
  }

  MockXMLHttpRequest.prototype.open = function () {};

  MockXMLHttpRequest.prototype.send = function () {
    var self = this;
    setTimeout(function () {
      if (self._response.networkError) {
        if (self.onerror) {
          self.onerror();
        }
        return;
      }

      self.status = self._response.status;
      self.responseText = self._response.body;
      if (self.onload) {
        self.onload();
      }
    }, 0);
  };

  return MockXMLHttpRequest;
}

function loadFreshAlmost() {
  delete require.cache[require.resolve('../almost.js')];
  return require('../almost.js');
}

function loadOnce(almost) {
  return new Promise(function (resolve) {
    almost.load(function (error) {
      resolve(error);
    });
  });
}

test.afterEach(function () {
  delete global.window;
  delete global.XMLHttpRequest;
});

test('load coalesces concurrent calls into one request', async function () {
  var counter = { count: 0 };
  var almost;
  var errors;

  global.window = { crypto: buildWindowCrypto() };
  global.XMLHttpRequest = buildMockXMLHttpRequest(
    [{ status: 200, body: wordlistData }],
    counter
  );
  almost = loadFreshAlmost();

  errors = await Promise.all([loadOnce(almost), loadOnce(almost)]);
  assert.equal(counter.count, 1);
  assert.deepEqual(errors, [null, null]);
});

test('load fails when integrity hash does not match', async function () {
  var tamperedWordlist = wordlistData.replace('11111\ta', '11111\tb');
  var counter = { count: 0 };
  var almost;
  var error;

  global.window = { crypto: buildWindowCrypto() };
  global.XMLHttpRequest = buildMockXMLHttpRequest(
    [{ status: 200, body: tamperedWordlist }],
    counter
  );
  almost = loadFreshAlmost();

  error = await loadOnce(almost);
  assert.equal(counter.count, 1);
  assert.equal(error, 'Error: Word list integrity check failed.');
});

test('load retries after a failed integrity check', async function () {
  var tamperedWordlist = wordlistData.replace('11111\ta', '11111\tb');
  var counter = { count: 0 };
  var almost;
  var firstError;
  var secondError;

  global.window = { crypto: buildWindowCrypto() };
  global.XMLHttpRequest = buildMockXMLHttpRequest(
    [
      { status: 200, body: tamperedWordlist },
      { status: 200, body: wordlistData },
    ],
    counter
  );
  almost = loadFreshAlmost();

  firstError = await loadOnce(almost);
  secondError = await loadOnce(almost);

  assert.equal(firstError, 'Error: Word list integrity check failed.');
  assert.equal(secondError, null);
  assert.equal(counter.count, 2);
});
