var almost = (function() {
    function lookupWord(id)
    {
        // TODO: Return the specified entry from our words list.
        return 'word' + id;
    }
    
    return {
        getWords : function(howMany) {
            if (window.crypto && window.crypto.getRandomValues) {
                // Get random values using a (believed to be) cryptographically secure method.			
                // See http://stackoverflow.com/questions/5651789/is-math-random-cryptographically-secure
                var array = new Uint32Array(howMany);
                window.crypto.getRandomValues(array);

                // Build our passphrase. The words are space delimited.
                var p = '';
                for (var i = 0; i < array.length; i++) {
                    // Choose a corresponding entry from our words list.
                var word = lookupWord(array[i]);
                    p += ' ' + word;
                }

                // TODO: Trim the leading/trailing spaces.

                return p;
            }
            else {
                return "Error: Cannot find a cryptographically secure source of randomness."
            }
        }
    };
})();