/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
chai.use(require('chai-as-promised')).should();
const utils = require('./index');
const sleep = require('util').promisify(setTimeout);

exports.test = function(web3, accounts, token) {
  describe('lockAndDistributeTokens', function() {
    beforeEach(async function() {
      await token.contract.methods
        .mint(accounts[0], web3.utils.toWei('10'), '0xcafe')
        .send({
          from: accounts[0],
          gas: 4600000,
        });
      let currentBlock = await web3.eth.getBlockNumber();
      let { timestamp } = await web3.eth.getBlock(currentBlock);

      //lock 90% of account 1's tokens
      await token.contract.methods
        .lockAndDistributeTokens(
          accounts[1],
          web3.utils.toWei('10'),
          90,
          timestamp + 10
        )
        .send({
          from: accounts[0],
          gas: 4600000,
        });

      assert.equal(
        web3.utils.toWei('1'),
        await token.contract.methods
          .getAmountOfUnlockedTokens(accounts[1])
          .call({ gas: 300000, from: accounts[1] })
      );
    });

    it(
      `should let ${utils.formatAccount(accounts[1])} ` +
        `send 1 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])}`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);

        await token.contract.methods
          .send(accounts[2], web3.utils.toWei('1'))
          .send({ gas: 300000, from: accounts[1] });

        await utils.getBlock(web3);

        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 9);
        await utils.assertBalance(web3, token, accounts[2], 1);
      }
    );

    it(
      `should not let ${utils.formatAccount(accounts[1])} ` +
        `send 2 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])} since 9/10 are locked`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);

        await token.contract.methods
          .send(accounts[2], web3.utils.toWei('2'), '0xcafe')
          .send({ gas: 300000, from: accounts[1] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);

        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
      }
    );

    it(
      `should let ${utils.formatAccount(accounts[1])} ` +
        `send 5 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])} after the lock period expired`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);

        await sleep(10000);
        assert.equal(
          web3.utils.toWei('10'),
          await token.contract.methods
            .getAmountOfUnlockedTokens(accounts[1])
            .call({ gas: 300000, from: accounts[1] })
        );

        await token.contract.methods
          .send(accounts[2], web3.utils.toWei('5'), '0xcafe')
          .send({ gas: 300000, from: accounts[1] });

        await utils.getBlock(web3);

        assert.equal(
          web3.utils.toWei('5'),
          await token.contract.methods
            .getAmountOfUnlockedTokens(accounts[1])
            .call({ gas: 300000, from: accounts[1] })
        );
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 5);
        await utils.assertBalance(web3, token, accounts[2], 5);
      }
    );

    it(
      `should let ${utils.formatAccount(accounts[1])} ` +
        `transfer 1 ${token.symbol} to ${utils.formatAccount(accounts[2])} `,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);

        await token.contract.methods
          .transfer(accounts[2], web3.utils.toWei('1'))
          .send({ gas: 300000, from: accounts[1] });

        await utils.getBlock(web3);

        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 9);
        await utils.assertBalance(web3, token, accounts[2], 1);
      }
    );

    it(
      `should not let ${utils.formatAccount(accounts[1])} ` +
        `transfer 10 ${token.symbol} to ${utils.formatAccount(
          accounts[2]
        )} when 9/10 are locked`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);

        await token.contract.methods
          .transfer(accounts[2], web3.utils.toWei('10'))
          .send({ gas: 300000, from: accounts[1] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);

        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
      }
    );

    it(
      `should let ${utils.formatAccount(accounts[1])} ` +
        `transfer 5 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])} after the lock period expired`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);

        await sleep(10000);
        assert.equal(
          web3.utils.toWei('10'),
          await token.contract.methods
            .getAmountOfUnlockedTokens(accounts[1])
            .call({ gas: 300000, from: accounts[1] })
        );

        await token.contract.methods
          .transfer(accounts[2], web3.utils.toWei('5'))
          .send({ gas: 300000, from: accounts[1] });

        await utils.getBlock(web3);
        assert.equal(
          web3.utils.toWei('5'),
          await token.contract.methods
            .getAmountOfUnlockedTokens(accounts[1])
            .call({ gas: 300000, from: accounts[1] })
        );

        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 5);
        await utils.assertBalance(web3, token, accounts[2], 5);
      }
    );

    it(
      `should let ${utils.formatAccount(accounts[1])} ` +
        `transferFrom 1 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])} before the lock period expired`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );

        await token.contract.methods
          .approve(accounts[9], web3.utils.toWei('1'))
          .send({ gas: 300000, from: accounts[1] });
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          web3.utils.toWei('1')
        );

        await token.contract.methods
          .transferFrom(accounts[1], accounts[2], web3.utils.toWei('1'))
          .send({ gas: 300000, from: accounts[9] });

        await utils.getBlock(web3);

        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 9);
        await utils.assertBalance(web3, token, accounts[2], 1);
        await utils.assertBalance(web3, token, accounts[9], 0);
      }
    );

    it(
      `should not let ${utils.formatAccount(accounts[1])} ` +
        `transferFrom 10 ${token.symbol} ` +
        `to ${utils.formatAccount(
          accounts[2]
        )} before the lock period expired when 9/10 locked`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );

        await token.contract.methods
          .approve(accounts[9], web3.utils.toWei('10'))
          .send({ gas: 300000, from: accounts[1] })
          .should.be.rejectedWith('revert');
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          web3.utils.toWei('0')
        );

        await token.contract.methods
          .transferFrom(accounts[1], accounts[2], web3.utils.toWei('10'))
          .send({ gas: 300000, from: accounts[9] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);

        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
      }
    );

    it(
      `should let ${utils.formatAccount(accounts[1])} ` +
        `transferFrom 5 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])} after the lock period expired`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );

        await sleep(10000);
        assert.equal(
          web3.utils.toWei('10'),
          await token.contract.methods
            .getAmountOfUnlockedTokens(accounts[1])
            .call({ gas: 300000, from: accounts[1] })
        );

        await token.contract.methods
          .approve(accounts[9], web3.utils.toWei('5'))
          .send({ gas: 300000, from: accounts[1] });

        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          web3.utils.toWei('5')
        );

        await token.contract.methods
          .transferFrom(accounts[1], accounts[2], web3.utils.toWei('5'))
          .send({ gas: 300000, from: accounts[9] });

        await utils.getBlock(web3);

        assert.equal(
          web3.utils.toWei('5'),
          await token.contract.methods
            .getAmountOfUnlockedTokens(accounts[1])
            .call({ gas: 300000, from: accounts[1] })
        );

        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 5);
        await utils.assertBalance(web3, token, accounts[2], 5);
        await utils.assertBalance(web3, token, accounts[9], 0);
      }
    );

    it(
      `should let ${utils.formatAccount(accounts[1])} ` +
        `operatorSend 1 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])} before the lock period expired`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );
        assert.equal(
          await token.contract.methods
            .isOperatorFor(accounts[9], accounts[1])
            .call({ gas: 300000, from: accounts[1] }),
          false
        );

        await token.contract.methods
          .authorizeOperator(accounts[9])
          .send({ gas: 300000, from: accounts[1] });

        assert.equal(
          await token.contract.methods
            .isOperatorFor(accounts[9], accounts[1])
            .call({ gas: 300000, from: accounts[1] }),
          true
        );

        await token.contract.methods
          .operatorSend(
            accounts[1],
            accounts[2],
            web3.utils.toWei('1'),
            '0xcafe',
            '0xcafe'
          )
          .send({ gas: 300000, from: accounts[9] });

        await utils.getBlock(web3);

        assert.equal(
          await token.contract.methods
            .isOperatorFor(accounts[9], accounts[1])
            .call({ gas: 300000, from: accounts[1] }),
          true
        );
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 9);
        await utils.assertBalance(web3, token, accounts[2], 1);
        await utils.assertBalance(web3, token, accounts[9], 0);
      }
    );

    it(
      `should not let ${utils.formatAccount(accounts[1])} ` +
        `operatorSend 10 ${token.symbol} ` +
        `to ${utils.formatAccount(
          accounts[2]
        )} before the lock period expired when 9/10 locked`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );
        assert.equal(
          await token.contract.methods
            .isOperatorFor(accounts[9], accounts[1])
            .call({ gas: 300000, from: accounts[1] }),
          false
        );

        await token.contract.methods
          .authorizeOperator(accounts[9])
          .send({ gas: 300000, from: accounts[1] });

        assert.equal(
          await token.contract.methods
            .isOperatorFor(accounts[9], accounts[1])
            .call({ gas: 300000, from: accounts[1] }),
          true
        );

        await token.contract.methods
          .operatorSend(
            accounts[1],
            accounts[2],
            web3.utils.toWei('10'),
            '0xcafe',
            '0xcafe'
          )
          .send({ gas: 300000, from: accounts[9] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);

        assert.equal(
          await token.contract.methods
            .isOperatorFor(accounts[9], accounts[1])
            .call({ gas: 300000, from: accounts[1] }),
          true
        );
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
      }
    );

    it(
      `should  let ${utils.formatAccount(accounts[1])} ` +
        `operatorSend 5 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])} after the lock period expired`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );
        assert.equal(
          await token.contract.methods
            .isOperatorFor(accounts[9], accounts[1])
            .call({ gas: 300000, from: accounts[1] }),
          false
        );

        await token.contract.methods
          .authorizeOperator(accounts[9])
          .send({ gas: 300000, from: accounts[1] });

        await sleep(10000);
        assert.equal(
          web3.utils.toWei('10'),
          await token.contract.methods
            .getAmountOfUnlockedTokens(accounts[1])
            .call({ gas: 300000, from: accounts[1] })
        );

        assert.equal(
          await token.contract.methods
            .isOperatorFor(accounts[9], accounts[1])
            .call({ gas: 300000, from: accounts[1] }),
          true
        );

        await token.contract.methods
          .operatorSend(
            accounts[1],
            accounts[2],
            web3.utils.toWei('5'),
            '0xcafe',
            '0xcafe'
          )
          .send({ gas: 300000, from: accounts[9] });

        await utils.getBlock(web3);

        assert.equal(
          web3.utils.toWei('5'),
          await token.contract.methods
            .getAmountOfUnlockedTokens(accounts[1])
            .call({ gas: 300000, from: accounts[1] })
        );

        assert.equal(
          await token.contract.methods
            .isOperatorFor(accounts[9], accounts[1])
            .call({ gas: 300000, from: accounts[1] }),
          true
        );
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 5);
        await utils.assertBalance(web3, token, accounts[2], 5);
        await utils.assertBalance(web3, token, accounts[9], 0);
      }
    );

    it(
      `should  let ${utils.formatAccount(accounts[1])} ` +
        `transferFrom 1 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])} before the lock period expired`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );

        await token.contract.methods
          .approveAndCall(accounts[9], web3.utils.toWei('1'), '0xcafe')
          .send({ gas: 300000, from: accounts[1] });

        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          web3.utils.toWei('1')
        );

        await token.contract.methods
          .operatorSend(
            accounts[1],
            accounts[2],
            web3.utils.toWei('10'),
            '0xcafe',
            '0xcafe'
          )
          .send({ gas: 300000, from: accounts[9] })
          .should.be.rejectedWith('revert');

        await token.contract.methods
          .transferFrom(accounts[1], accounts[2], web3.utils.toWei('1'))
          .send({ gas: 300000, from: accounts[9] });

        await utils.getBlock(web3);

        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 9);
        await utils.assertBalance(web3, token, accounts[2], 1);
        await utils.assertBalance(web3, token, accounts[9], 0);
      }
    );

    it(
      `should not let ${utils.formatAccount(accounts[1])} ` +
        `transferFrom 10 ${token.symbol} ` +
        `to ${utils.formatAccount(
          accounts[2]
        )} before the lock period expired when 9/10 locked`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );

        await token.contract.methods
          .approveAndCall(accounts[9], web3.utils.toWei('10'), '0xcafe')
          .send({ gas: 300000, from: accounts[1] })
          .should.be.rejectedWith('revert');

        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          web3.utils.toWei('0')
        );

        await token.contract.methods
          .operatorSend(
            accounts[1],
            accounts[2],
            web3.utils.toWei('10'),
            '0xcafe',
            '0xcafe'
          )
          .send({ gas: 300000, from: accounts[9] })
          .should.be.rejectedWith('revert');

        await token.contract.methods
          .transferFrom(accounts[1], accounts[2], web3.utils.toWei('10'))
          .send({ gas: 300000, from: accounts[9] })
          .should.be.rejectedWith('revert');
        await token.contract.methods
          .transferFrom(accounts[1], accounts[2], web3.utils.toWei('1'))
          .send({ gas: 300000, from: accounts[9] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);

        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
      }
    );

    it(
      `should let ${utils.formatAccount(accounts[1])} ` +
        `transferFrom 5 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])} after the lock period expired`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 0);
        await utils.assertBalance(web3, token, accounts[9], 0);
        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );

        await sleep(10000);
        assert.equal(
          web3.utils.toWei('10'),
          await token.contract.methods
            .getAmountOfUnlockedTokens(accounts[1])
            .call({ gas: 300000, from: accounts[1] })
        );

        await token.contract.methods
          .approveAndCall(accounts[9], web3.utils.toWei('5'), '0xcafe')
          .send({ gas: 300000, from: accounts[1] });

        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          web3.utils.toWei('5')
        );

        await token.contract.methods
          .operatorSend(
            accounts[1],
            accounts[2],
            web3.utils.toWei('5'),
            '0xcafe',
            '0xcafe'
          )
          .send({ gas: 300000, from: accounts[9] })
          .should.be.rejectedWith('revert');

        await token.contract.methods
          .transferFrom(accounts[1], accounts[2], web3.utils.toWei('5'))
          .send({ gas: 300000, from: accounts[9] });

        await utils.getBlock(web3);
        assert.equal(
          web3.utils.toWei('5'),
          await token.contract.methods
            .getAmountOfUnlockedTokens(accounts[1])
            .call({ gas: 300000, from: accounts[1] })
        );

        assert.equal(
          await token.contract.methods
            .allowance(accounts[1], accounts[9])
            .call({ gas: 300000, from: accounts[1] }),
          0
        );
        await utils.assertTotalSupply(web3, token, 10);
        await utils.assertBalance(web3, token, accounts[0], 0);
        await utils.assertBalance(web3, token, accounts[1], 5);
        await utils.assertBalance(web3, token, accounts[2], 5);
        await utils.assertBalance(web3, token, accounts[9], 0);
      }
    );
  });
};
