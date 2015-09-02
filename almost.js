var almost = (function() {
    this.wordlist = [];

    var load = function(callback) {
        var that = this;
        that.callback = callback;

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
                        that.wordlist.push(word[1]);
                    }
                }

                that.callback();
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

    return {
        getWords : function(howMany) {
            var c = window.crypto || window.msCrypto;
            if (c && c.getRandomValues) {
                // Get random values using a (believed to be) cryptographically secure method.
                // See http://stackoverflow.com/questions/5651789/is-math-random-cryptographically-secure
                var array = new Uint32Array(/*edge requires explicit type conversion*/Number(howMany));
                c.getRandomValues(array);

                // Build our passphrase. The words are space delimited.
                return load(function() {
                    var p = '';
                    for (var i = 0; i < array.length; i++) {
                        // Choose a corresponding entry from our words list.
                        var word = wordlist[5];
                        p += ' ' + word;
                    }

                    // trim() is native to String only in browsers that support ECMAScript 5
                    if (!String.prototype.trim) {
                        String.prototype.trim = function() {
                            return this.replace(/^\s+|\s+$/g,'');
                        };
                    }

                    return p.trim();
                });
            }
            else {
                return "Error: Cannot find a cryptographically secure source of randomness."
            }
        }
    };
})();
