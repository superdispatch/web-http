'use strict';

module.exports = {
  overrides: [
    {
      files: '*.js',
      extends: 'plugin:@superdispatch/node',
    },

    {
      files: '*.ts',
      extends: [
        'plugin:@superdispatch/react',
        'plugin:@superdispatch/typescript',
      ],
      parserOptions: {
        project: './tsconfig.json',
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'eslint-comments/no-use': [
          'error',
          { allow: ['eslint-disable-next-line'] },
        ],

        'no-restricted-imports': [
          'error',
          {
            paths: ['dequal'],
          },
        ],

        'import/no-internal-modules': [
          'error',
          {
            allow: ['**/packages/*/src/**', 'dequal/lite', 'swr/esm/types'],
          },
        ],
      },
    },

    {
      files: ['**/*.spec.{ts,tsx}', '**/__testutils__/**/*.{ts,tsx}'],
      extends: ['plugin:@superdispatch/ts-jest'],
      rules: {
        'import/no-internal-modules': 'off',
      },
    },
  ],
};
