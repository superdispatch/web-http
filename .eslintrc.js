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
      files: ['**/{__tests__,__testutils__}/**/*.{ts,tsx}'],
      extends: ['plugin:@superdispatch/jest'],
      rules: {
        quotes: 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'import/no-internal-modules': 'off',
        'import/no-anonymous-default-export': 'off',
        'import/no-extraneous-dependencies': 'off',
        'testing-library/prefer-screen-queries': 'off',
      },
    },
  ],
};
