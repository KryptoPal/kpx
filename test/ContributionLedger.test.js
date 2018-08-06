/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const { URL } = require('url');
const Web3 = require('web3');
const OldContributionLedger = artifacts.require('ContributionLedger');

contract('KPXV0_1_0', function(accounts) {
  const provider = new URL(this.web3.currentProvider.host);
  provider.protocol = 'ws';
  const web3 = new Web3(provider.toString());

  let ContributionLedger = new web3.eth.Contract(OldContributionLedger.abi, {
    data: OldContributionLedger.bytecode,
    arguments: [10250],
  });

  after(async function() {
    await web3.currentProvider.connection.close();
  });

  beforeEach(async function() {
    ContributionLedger = await ContributionLedger.deploy({
      arguments: [10250],
    }).send({
      from: accounts[0],
      gas: 4600000,
    });
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: ContributionLedger.options.address,
      value: web3.utils.toWei('1'),
      gasPrice: web3.utils.toWei('10', 'gwei'),
      gasLimit: 4600000,
    });
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: ContributionLedger.options.address,
      value: web3.utils.toWei('5'),
      gasPrice: web3.utils.toWei('10', 'gwei'),
      gasLimit: 4600000,
    });
  });

  describe('getContributionCount', function() {
    it('should return acontribution count of 2 for account 1, and 0 for account 0', async function() {
      const contributionCountAcc0 = await ContributionLedger.methods
        .getContributionCount(accounts[0])
        .call({
          from: accounts[0],
          gas: 4600000,
        });
      const contributionCountAcc1 = await ContributionLedger.methods
        .getContributionCount(accounts[1])
        .call({
          from: accounts[0],
          gas: 4600000,
        });
      assert.equal(0, contributionCountAcc0);
      assert.equal(2, contributionCountAcc1);
    });
  });

  describe('setContribution', function() {
    it('should use the admin accoun to manually set a contribution', async function() {
      await ContributionLedger.methods
        .setContribution(accounts[3], web3.utils.toWei('1'), 500)
        .send({
          from: accounts[0],
          gas: 4600000,
        });
      const {
        0: contributionAmount3,
        1: estimatedTokens3,
        3: rate3,
        4: setByOwner3,
      } = await ContributionLedger.methods
        .getContribution(accounts[3], 0)
        .call({
          from: accounts[0],
          gas: 4600000,
        });

      const tokenEstimateAcc3 = await ContributionLedger.methods
        .getTokenEstimateForContributor(accounts[3])
        .call({
          from: accounts[0],
          gas: 4600000,
        });

      const tokenEstimateAcc0 = await ContributionLedger.methods
        .getTokenEstimateForContributor(accounts[0])
        .call({
          from: accounts[0],
          gas: 4600000,
        });
      assert.equal(web3.utils.toWei('500'), tokenEstimateAcc3);
      assert.equal(web3.utils.toWei('1'), contributionAmount3);
      assert.equal(web3.utils.toWei('500'), estimatedTokens3);
      assert.equal(500, rate3);
      assert.equal(true, setByOwner3);

      assert.equal(0, tokenEstimateAcc0);
    });
  });

  describe('getTokenEstimateForContributor', function() {
    it('should return a token estimate of 61500 for account 1 and 0 for account 0', async function() {
      const tokenEstimateAcc0 = await ContributionLedger.methods
        .getTokenEstimateForContributor(accounts[0])
        .call({
          from: accounts[0],
          gas: 4600000,
        });
      const tokenEstimateAcc1 = await ContributionLedger.methods
        .getTokenEstimateForContributor(accounts[1])
        .call({
          from: accounts[0],
          gas: 4600000,
        });
      assert.equal(0, tokenEstimateAcc0);
      assert.equal(web3.utils.toWei('61500'), tokenEstimateAcc1);
    });
  });

  describe('setRate', function() {
    it('should set the rate to 6833 kpx per eth', async function() {
      await ContributionLedger.methods.setRate(6833).send({
        from: accounts[0],
        gas: 4600000,
      });
      const rate = await ContributionLedger.methods.getRate().call({
        from: accounts[0],
        gas: 4600000,
      });
      await web3.eth.sendTransaction({
        from: accounts[1],
        to: ContributionLedger.options.address,
        value: web3.utils.toWei('1'),
        gasPrice: web3.utils.toWei('10', 'gwei'),
        gasLimit: 4600000,
      });
      const {
        0: contributionAmount2,
        1: estimatedTokens2,
        3: rate2,
        4: setByOwner2,
      } = await ContributionLedger.methods
        .getContribution(accounts[1], 2)
        .call({
          from: accounts[0],
          gas: 4600000,
        });
      const tokenEstimateAcc1 = await ContributionLedger.methods
        .getTokenEstimateForContributor(accounts[1])
        .call({
          from: accounts[0],
          gas: 4600000,
        });
      assert.equal(6833, rate);
      assert.equal(web3.utils.toWei('68333'), tokenEstimateAcc1);
      assert.equal(web3.utils.toWei('1'), contributionAmount2);
      assert.equal(web3.utils.toWei('6833'), estimatedTokens2);
      assert.equal(6833, rate2);
      assert.equal(false, setByOwner2);
    });
  });

  describe('getContribution', function() {
    it('should return both contributions for account1', async function() {
      const {
        0: contributionAmount0,
        1: estimatedTokens0,
        3: rate0,
        4: setByOwner0,
      } = await ContributionLedger.methods
        .getContribution(accounts[1], 0)
        .call({
          from: accounts[0],
          gas: 4600000,
        });
      const {
        0: contributionAmount1,
        1: estimatedTokens1,
        3: rate1,
        4: setByOwner1,
      } = await ContributionLedger.methods
        .getContribution(accounts[1], 1)
        .call({
          from: accounts[0],
          gas: 4600000,
        });

      assert.equal(web3.utils.toWei('1'), contributionAmount0);
      assert.equal(web3.utils.toWei('10250'), estimatedTokens0);
      assert.equal(10250, rate0);
      assert.equal(false, setByOwner0);

      assert.equal(web3.utils.toWei('5'), contributionAmount1);
      assert.equal(web3.utils.toWei('51250'), estimatedTokens1);
      assert.equal(10250, rate1);
      assert.equal(false, setByOwner1);
    });
  });
});
