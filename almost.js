var almost = {};

(function() {
    this.wordlist = [];

    almost.load = function(callback) {
        var request = new XMLHttpRequest();
        // Requires a web server; CORS will reject loading this via the file: protocol
        request.open('GET', 'diceware.wordlist.asc', true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // Extract the words
                var data = request.responseText;
                var lines = data.split('\n');
                for (var i = 0; i < lines.length; i++) {
                    line = lines[i];
                    if (line === '-----BEGIN PGP SIGNED MESSAGE-----') { continue; }
                    if (line === '') {  continue; }
                    if (line === '-----BEGIN PGP SIGNATURE-----') { break; }
                    var word = /^\d{5}\s(.+)$/.exec(line);
                    if (word) {
                        wordlist.push(word[1]);
                    }
                }

                callback();
            }
            else {
                // We reached our target server, but it returned an error
            }
        };

        request.onerror = function() {
            // There was a connection error of some sort
        };

        request.send();
    }

    almost.getWords = function(howMany) {
        var c = window.crypto || window.msCrypto;
        if (c && c.getRandomValues) {
            // Get random values using a (believed to be) cryptographically secure method
            // See http://stackoverflow.com/questions/5651789/is-math-random-cryptographically-secure
            var array = new Uint32Array(/*edge requires explicit type conversion*/Number(howMany));
            c.getRandomValues(array);

            // The words are space delimited.
            var p = '';
            for (var i = 0; i < array.length; i++) {
                // Grab the corresponding entry from our words list
                var word = wordlist[8]; // TODO: replace the hard-coded key
                p += ' ' + word;
            }

            // trim() is native to String only in browsers that support ECMAScript 5
            if (!String.prototype.trim) {
                String.prototype.trim = function() {
                    return this.replace(/^\s+|\s+$/g,'');
                };
            }

            return p.trim();
        }
        else {
            return "Error: Cannot find a cryptographically secure source of randomness."
        }
    };
})();
