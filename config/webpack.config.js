'use strict';

const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

function resolveLocal(id) {
  return path.join(ROOT_DIR, 'packages', id, 'pkg');
}

module.exports = {
  resolve: {
    alias: {
      '@superdispatch/http': resolveLocal('http'),
      '@superdispatch/http-resource': resolveLocal('http-resource'),
    },
  },
};
