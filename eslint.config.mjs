import google from 'eslint-config-google';
import globals from 'globals';

export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.jasmine,
      },
    },
    rules: {
      ...google.rules,
      'require-jsdoc': 'off',
      'valid-jsdoc': 'off',
      'max-len': ['error', {'code': 80, 'ignoreUrls': true}],
    },
  },
];
