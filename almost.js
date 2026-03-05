'use strict';

var almost = {};

(function () {
  var wordlist = [];
  var loadCallbacks = [];
  var isLoading = false;
  var loadError = null;
  var maxWords = 1000;
  var expectedWordCount = 7776;
  var expectedWordlistSha256 =
    'e06e7d4c695f85d39a79ebefe9b4c403e40ddcd5e65c5eac6c2be541c4619da9';

  function normalizeHowMany(howMany) {
    var parsed = Number(howMany);
    if (!isFinite(parsed) || parsed < 1) {
      return 1;
    }
    parsed = Math.floor(parsed);
    if (parsed > maxWords) {
      return maxWords;
    }
    return parsed;
  }

  function toWordIndex(randomValue, listLength) {
    // 0x0000..0xFFFF maps to 0..(listLength - 1)
    return Math.floor((randomValue / 65536) * listLength);
  }

  function extractWordsFromWordlistData(data) {
    var lines = data.split('\n');
    var line;
    var extractedWords = [];
    var match;
    var i;

    for (i = 0; i < lines.length; i++) {
      line = lines[i];
      if (line === '-----BEGIN PGP SIGNED MESSAGE-----') {
        continue;
      }
      if (line === 'Hash: SHA256') {
        continue;
      }
      if (line === '') {
        continue;
      }
      if (
        line ===
        'https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases'
      ) {
        continue;
      }
      if (line === '-----BEGIN PGP SIGNATURE-----') {
        break;
      }
      match = /^\d{5}\s(.+)$/.exec(line);
      if (match) {
        extractedWords.push(match[1]);
      }
    }

    return extractedWords;
  }

  function getSubtleCrypto() {
    var c = window.crypto || window.msCrypto;
    if (c && c.subtle && c.subtle.digest) {
      return c.subtle;
    }
    return null;
  }

  function textToUtf8Bytes(text) {
    var utf8;
    var bytes;
    var i;

    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(text);
    }

    // Fallback for older engines that lack TextEncoder.
    utf8 = unescape(encodeURIComponent(text));
    bytes = new Uint8Array(utf8.length);
    for (i = 0; i < utf8.length; i++) {
      bytes[i] = utf8.charCodeAt(i);
    }

    return bytes;
  }

  function bytesToHex(buffer) {
    var bytes = new Uint8Array(buffer);
    var hex = '';
    var i;
    var byteHex;

    for (i = 0; i < bytes.length; i++) {
      byteHex = bytes[i].toString(16);
      if (byteHex.length === 1) {
        byteHex = '0' + byteHex;
      }
      hex += byteHex;
    }

    return hex;
  }

  function flushLoadCallbacks(error) {
    var callback;
    while (loadCallbacks.length > 0) {
      callback = loadCallbacks.shift();
      callback(error);
    }
  }

  function hasExpectedWordCount(words) {
    return words.length === expectedWordCount;
  }

  function hasExpectedWordlistHash(digestHex) {
    return digestHex === expectedWordlistSha256;
  }

  function verifyWordlistSha256(data, callback) {
    var subtle = getSubtleCrypto();

    if (!subtle) {
      callback('Error: Cannot verify word list integrity in this browser.');
      return;
    }

    subtle
      .digest('SHA-256', textToUtf8Bytes(data))
      .then(function (hashBuffer) {
        var digestHex = bytesToHex(hashBuffer);
        if (!hasExpectedWordlistHash(digestHex)) {
          callback('Error: Word list integrity check failed.');
          return;
        }
        callback(null);
      })
      .catch(function () {
        callback('Error: Failed to verify word list integrity.');
      });
  }

  almost._internal = {
    normalizeHowMany: normalizeHowMany,
    toWordIndex: toWordIndex,
    extractWordsFromWordlistData: extractWordsFromWordlistData,
    hasExpectedWordCount: hasExpectedWordCount,
    hasExpectedWordlistHash: hasExpectedWordlistHash,
    expectedWordlistSha256: expectedWordlistSha256,
  };

  almost.load = function (callback) {
    var request;
    var extractedWords;

    if (typeof callback !== 'function') {
      callback = function () {};
    }

    if (wordlist.length > 0) {
      // It's already loaded
      callback(null);
      return;
    }

    loadCallbacks.push(callback);
    if (isLoading) {
      return;
    }

    // Retry on demand after transient request errors.
    loadError = null;
    isLoading = true;

    // Requires a web server; CORS will reject loading this via the file: protocol
    request = new XMLHttpRequest();
    request.open('GET', 'eff_large_wordlist.asc', true);

    request.onload = function () {
      var wordlistData;

      if (request.status >= 200 && request.status < 400) {
        wordlistData = request.responseText;
        verifyWordlistSha256(wordlistData, function (verificationError) {
          if (verificationError) {
            loadError = verificationError;
            isLoading = false;
            flushLoadCallbacks(loadError);
            return;
          }

          extractedWords = extractWordsFromWordlistData(wordlistData);
          if (!hasExpectedWordCount(extractedWords)) {
            loadError =
              'Error: Could not parse the expected Diceware list (7776 words).';
            isLoading = false;
            flushLoadCallbacks(loadError);
            return;
          }

          wordlist = extractedWords;
          isLoading = false;
          flushLoadCallbacks(null);
        });
        return;
      }

      loadError = 'Error: Failed to load word list (HTTP ' + request.status + ').';
      isLoading = false;
      flushLoadCallbacks(loadError);
    };

    request.onerror = function () {
      loadError = 'Error: Network problem while loading word list.';
      isLoading = false;
      flushLoadCallbacks(loadError);
    };

    request.send();
  };

  almost.getWords = function (howMany) {
    var c = window.crypto || window.msCrypto;
    var howManyNumber;
    var array;
    var words;
    var word;
    var i;
    var j;

    if (!wordlist.length) {
      return 'Error: Word list is not loaded yet. Please try again.';
    }

    if (c && c.getRandomValues) {
      // Get random values using a cryptographically sound method
      // http://stackoverflow.com/questions/5651789/is-math-random-cryptographically-secure
      howManyNumber = normalizeHowMany(howMany);
      // Edge requires explicit type conversion
      array = new Uint16Array(howManyNumber);
      c.getRandomValues(array);

      words = [];
      for (i = 0; i < array.length; i++) {
        j = toWordIndex(array[i], wordlist.length);
        word = wordlist[j];
        words.push(word);
      }

      return words.join(' ');
    }
    return (
      'Error: Cannot find a cryptographically sound random number generator. ' +
      'Please try another more modern browser.'
    );
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = almost;
}
