var almost = {};

(function() {
    this.wordlist = [];

    almost.load = function(callback) {
        if (wordlist.length > 0) {
            // It's already loaded
            callback();
            return;
        }

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
            // Get random values using a (believed to be) cryptographically sound method
            // See http://stackoverflow.com/questions/5651789/is-math-random-cryptographically-secure
            var array = new Uint16Array(/*edge requires explicit type conversion*/Number(howMany));
            c.getRandomValues(array);

            var words = [];
            var uint16_range = 65535; // 0xFFFF - 0x0000
            for (var i = 0; i < array.length; i++) {
                // Get our random number as a percent along the range of possibilities
                var pct = array[i] / uint16_range;
                // Scale up for the number of words we have
                var j = Math.floor(pct * wordlist.length);
                var word = wordlist[j];
                words.push(word);
            }

            return words.join(' ');
        }
        else {
            return "Error: Cannot find a cryptographically secure source of randomness."
        }
    };
})();
