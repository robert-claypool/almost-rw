var almost = (function() {
    function lookupWord(id)
    {
        // TODO: Return the specified entry from our words list.
        return 'word' + id;
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
                var p = '';
                for (var i = 0; i < array.length; i++) {
                    // Choose a corresponding entry from our words list.
                    var word = lookupWord(array[i]);
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
        }
    };
})();
