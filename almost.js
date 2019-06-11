'use strict';

var almost = {};

(function() {
  var wordlist = [];
  var request;
  var uInt16Range;
  var array;
  var data;
  var lines;
  var line;
  var words;
  var word;
  var pct;
  var c;
  var i;
  var j;

  almost.load = function(callback) {
    if (wordlist.length > 0) {
      // It's already loaded
      callback();
      return;
    }

    // Requires a web server; CORS will reject loading this via the file: protocol
    request = new XMLHttpRequest();
    request.open('GET', 'eff_large_wordlist.asc', true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        // Extract the words
        data = request.responseText;
        lines = data.split('\n');
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
          word = /^\d{5}\s(.+)$/.exec(line);
          if (word) {
            wordlist.push(word[1]);
          }
        }
        callback();
      } else {
        // We reached our target server, but it returned an error
        // TODO: handle it
      }
    };

    request.onerror = function() {
      // There was a connection error of some sort
      // TODO: handle it
    };

    request.send();
  };

  almost.getWords = function(howMany) {
    c = window.crypto || window.msCrypto;
    if (c && c.getRandomValues) {
      // Get random values using a cryptographically sound method
      // http://stackoverflow.com/questions/5651789/is-math-random-cryptographically-secure
      if (howMany > 1000) {
        howMany = 1000;
      }
      // Edge requires explicit type conversion
      array = new Uint16Array(Number(howMany));
      c.getRandomValues(array);

      words = [];
      uInt16Range = 65535; // 0xFFFF - 0x0000
      for (i = 0; i < array.length; i++) {
        // Get our random number as a percent along the range of possibilities
        pct = array[i] / uInt16Range;
        // Scale up for the number of words we have
        j = Math.floor(pct * wordlist.length);
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
