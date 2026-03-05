'use strict';

(function () {
  var runButton = document.getElementById('run');
  var howManyInput = document.getElementById('howMany');
  var result = document.getElementById('result');

  function run() {
    runButton.disabled = true;
    result.textContent = 'Loading word list...';
    almost.load(function (loadError) {
      if (loadError) {
        result.textContent = loadError;
        runButton.disabled = false;
        return;
      }

      result.textContent = almost.getWords(howManyInput.value);
      runButton.disabled = false;
    });
  }

  runButton.addEventListener('click', run);
})();
