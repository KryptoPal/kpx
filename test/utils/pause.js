/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
chai.use(require('chai-as-promised')).should();
const utils = require('./index');

exports.test = function(web3, accounts, token) {
  describe('send', function() {
    beforeEach(async function() {
      await utils.mintForAllAccounts(
        web3,
        accounts,
        token,
        accounts[0],
        '10',
        100000
      );
      await token.contract.methods
        .pause()
        .send({ gas: 300000, from: accounts[0] });
    });

    it(
      `should let ${utils.formatAccount(accounts[1])} ` +
        `send 3 ${token.symbol} ` +
        `to ${utils.formatAccount(accounts[2])}`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);

        await token.contract.methods
          .send(accounts[2], web3.utils.toWei('3'))
          .send({ gas: 300000, from: accounts[1] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);
        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);
      }
    );

    it(
      `should not let ${utils.formatAccount(accounts[1])} ` +
        `send 3 ${token.symbol} wtih data ` +
        `to ${utils.formatAccount(accounts[2])}` +
        '(Paused)',
      async function() {
        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);

        await token.contract.methods
          .send(accounts[2], web3.utils.toWei('3'), '0xcafe')
          .send({ gas: 300000, from: accounts[1] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);
        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);
      }
    );

    it(
      `should not let ${utils.formatAccount(accounts[1])} ` +
        `send 3 ${token.symbol} to ${utils.formatAccount(accounts[2])} ` +
        '(Paused)',
      async function() {
        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);

        await token.disableERC20();

        await token.contract.methods
          .send(accounts[2], web3.utils.toWei('3'))
          .send({ gas: 300000, from: accounts[1] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);

        // TODO check events
        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);
      }
    );

    it(
      `should not let ${utils.formatAccount(accounts[1])} ` +
        `transfer 3 ${token.symbol} to ${utils.formatAccount(accounts[2])} ` +
        '(Paused)',
      async function() {
        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);

        await token.disableERC20();

        await token.contract.methods
          .transfer(accounts[2], web3.utils.toWei('3'))
          .send({ gas: 300000, from: accounts[1] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);

        // TODO check events
        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);
      }
    );
    it(
      `should not approve ${utils.formatAccount(accounts[3])} ` +
        `to send 3.5 ${token.symbol}` +
        ` from ${utils.formatAccount(accounts[1])} when paused`,
      async function() {
        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);

        await token.contract.methods
          .approve(accounts[3], web3.utils.toWei('3.5'))
          .send({ gas: 300000, from: accounts[1] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);
        const allowance = await token.contract.methods
          .allowance(accounts[1], accounts[3])
          .call();

        assert.strictEqual(allowance, web3.utils.toWei('0'));
        await utils.log(`allowance: ${allowance}`);

        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);
      }
    );
    it(
      `should not transferFrom affter approve ${utils.formatAccount(
        accounts[3]
      )} ` +
        `to send 3.5 ${token.symbol}` +
        ` from ${utils.formatAccount(accounts[1])} when paused`,
      async function() {
        await token.contract.methods
          .unpause()
          .send({ gas: 300000, from: accounts[0] });

        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);

        await token.contract.methods
          .approve(accounts[3], web3.utils.toWei('3.5'))
          .send({ gas: 300000, from: accounts[1] });

        await token.contract.methods
          .pause()
          .send({ gas: 300000, from: accounts[0] });

        await token.contract.methods
          .transferFrom(accounts[1], accounts[2], web3.utils.toWei('3'))
          .send({ gas: 300000, from: accounts[3] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);

        const allowance = await token.contract.methods
          .allowance(accounts[1], accounts[3])
          .call();

        assert.strictEqual(web3.utils.fromWei(allowance), '3.5');
        await utils.log(`allowance: ${allowance}`);

        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);
      }
    );

    it(
      `should not authorize ${utils.formatAccount(
        accounts[3]
      )} as an operator ` +
        `for ${utils.formatAccount(accounts[1])} when paused`,
      async function() {
        await token.contract.methods
          .authorizeOperator(accounts[3])
          .send({ from: accounts[1], gas: 300000 })
          .should.be.rejectedWith('revert');

        assert.isFalse(
          await token.contract.methods
            .isOperatorFor(accounts[3], accounts[1])
            .call()
        );
      }
    );

    it(
      `should not let ${utils.formatAccount(accounts[3])} ` +
        `send 1.12 ${token.symbol} from ${utils.formatAccount(accounts[1])} ` +
        `to ${utils.formatAccount(accounts[2])} when paused`,
      async function() {
        await token.contract.methods
          .unpause()
          .send({ gas: 300000, from: accounts[0] });
        await token.contract.methods
          .authorizeOperator(accounts[3])
          .send({ from: accounts[1], gas: 300000 });

        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);

        await token.contract.methods
          .pause()
          .send({ gas: 300000, from: accounts[0] });

        await token.contract.methods
          .operatorSend(
            accounts[1],
            accounts[2],
            web3.utils.toWei('1.12'),
            '0x',
            '0x'
          )
          .send({ gas: 300000, from: accounts[3] })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);
        await utils.assertTotalSupply(web3, token, 10 * accounts.length);
        await utils.assertBalance(web3, token, accounts[1], 10);
        await utils.assertBalance(web3, token, accounts[2], 10);
      }
    );

    it(
      `should not revoke ${utils.formatAccount(
        accounts[3]
      )} as an operator for ` +
        `${utils.formatAccount(accounts[1])} when paused`,
      async function() {
        await token.contract.methods
          .unpause()
          .send({ gas: 300000, from: accounts[0] });
        await token.contract.methods
          .authorizeOperator(accounts[3])
          .send({ from: accounts[1], gas: 300000 });

        assert.isTrue(
          await token.contract.methods
            .isOperatorFor(accounts[3], accounts[1])
            .call()
        );
        await token.contract.methods
          .pause()
          .send({ gas: 300000, from: accounts[0] });
        await token.contract.methods
          .revokeOperator(accounts[3])
          .send({ from: accounts[1], gas: 300000 })
          .should.be.rejectedWith('revert');

        await utils.getBlock(web3);
        assert.isTrue(
          await token.contract.methods
            .isOperatorFor(accounts[3], accounts[1])
            .call()
        );
      }
    );
  });
};
