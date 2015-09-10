"use strict";
var almost = {};

(function() {
    var wordlist = [];

    almost.load = function(callback) {
        if (wordlist.length > 0) {
            // It's already loaded
            callback();
            return;
        }

        let request = new XMLHttpRequest();
        // Requires a web server; CORS will reject loading this via the file: protocol
        request.open('GET', 'diceware.wordlist.asc', true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // Extract the words
                let data = request.responseText;
                let lines = data.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    if (line === '-----BEGIN PGP SIGNED MESSAGE-----') { continue; }
                    if (line === '') {  continue; }
                    if (line === '-----BEGIN PGP SIGNATURE-----') { break; }
                    let word = /^\d{5}\s(.+)$/.exec(line);
                    if (word) {
                        wordlist.push(word[1]);
                    }
                }
                callback();
            }
            else {
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
        let c = window.crypto || window.msCrypto;
        if (c && c.getRandomValues) {
            // Get random values using a cryptographically sound method
            // See http://stackoverflow.com/questions/5651789/is-math-random-cryptographically-secure
            if (howMany > 1000) { howMany = 1000; }
            let array = new Uint16Array(/*edge requires explicit type conversion*/Number(howMany));
            c.getRandomValues(array);

            let words = [];
            const uint16_range = 65535; // 0xFFFF - 0x0000
            for (let i = 0; i < array.length; i++) {
                // Get our random number as a percent along the range of possibilities
                let pct = array[i] / uint16_range;
                // Scale up for the number of words we have
                let j = Math.floor(pct * wordlist.length);
                let word = wordlist[j];
                words.push(word);
            }

            return words.join(' ');
        }
        else {
            return "Error: Cannot find a cryptographically sound random number generator. " +
                   "Please try another more modern browser.";
        }
    };
})();
