'use strict';

var almost = {};

(function () {
  var wordlist = [];
  var loadCallbacks = [];
  var isLoading = false;
  var loadError = null;
  var maxWords = 1000;
  var expectedWordCount = 7776;

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

  almost._internal = {
    normalizeHowMany: normalizeHowMany,
    toWordIndex: toWordIndex,
    extractWordsFromWordlistData: extractWordsFromWordlistData,
    hasExpectedWordCount: hasExpectedWordCount,
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
      if (request.status >= 200 && request.status < 400) {
        extractedWords = extractWordsFromWordlistData(request.responseText);
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
