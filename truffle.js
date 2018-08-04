// require('babel-register')({
//   ignore: /node_modules\/(?!zeppelin-solidity)/,
// });
// require('babel-polyfill');

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    test: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    coverage: {
      host: 'localhost',
      port: 8555,
      network_id: '*', // eslint-disable-line camelcase
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    ropstenGeth: {
      host: 'localhost',
      port: 8545,
      network_id: 3,
      gas: 5219725,
      from: '0x1c128de6b93557651e0dc5b55f23496ffac7a0a9',
    },
    live: {
      gasPrice: 20000000000, // 10 gwei
      host: 'localhost',
      port: 8545,
      network_id: 1,
      gas: 5219725,
      from: '0x1c128de6b93557651e0dc5b55f23496ffac7a0a9',
    },
  },
};
