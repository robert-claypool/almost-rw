'use strict';

module.exports = [
  {
    files: ['almost.js', 'app.js'],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',
      globals: {
        almost: 'readonly',
        document: 'readonly',
        window: 'readonly',
        XMLHttpRequest: 'readonly',
        Uint16Array: 'readonly',
      },
    },
    rules: {
      indent: ['warn', 2],
      'linebreak-style': ['error', 'unix'],
      semi: ['error', 'always'],
    },
  },
];
