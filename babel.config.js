'use strict';

module.exports = (api) => {
  api.cache.using(() => JSON.stringify([process.env.NODE_ENV]));

  return {
    presets: [
      [
        '@superdispatch/babel-preset',
        {
          jsx: false,
          loose: true,
          targets: 'esmodules',
          optimize: {
            react: false,
            pureCalls: true,
          },
        },
      ],
    ],
  };
};
