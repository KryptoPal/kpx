/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const abi = require('ethereumjs-abi');
const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-as-promised')).should();
const { URL } = require('url');
const Web3 = require('web3');
const OldReferenceToken = artifacts.require('KPXV0_1_0');
const OldEIP820Registry = artifacts.require('RootRegistryV0_1_0');
const OldUnstructuredOwnedUpgradeabilityProxy = artifacts.require(
  'UnstructuredOwnedUpgradeabilityProxy'
);
const utils = require('./utils');

function encodeCall(name, _arguments, values) {
  const methodId = abi.methodID(name, _arguments).toString('hex');
  const params = abi.rawEncode(_arguments, values).toString('hex');
  return `0x${methodId}${params}`;
}

contract('KPXV0_1_0', function(accounts) {
  const provider = new URL(this.web3.currentProvider.host);
  provider.protocol = 'ws';
  const web3 = new Web3(provider.toString());
  const ReferenceToken = new web3.eth.Contract(OldReferenceToken.abi, {
    data: OldReferenceToken.bytecode,
  });
  let UnstructuredOwnedUpgradeabilityProxy;

  let Erc820Registry = new web3.eth.Contract(OldEIP820Registry.abi, {
    data: OldEIP820Registry.bytecode,
    arguments: [accounts[0]],
  });

  let token = {
    name: 'KryptoX',
    symbol: 'KPX',
    granularity: '0.01',
    totalSupply: '0',
    defaultBalance: '0',
  };

  const deployContract = ReferenceToken.deploy();

  const initializeToken = async (token, registryAddr) => {
    await token.contract.methods
      .initialize(
        token.name,
        token.symbol,
        web3.utils.toWei(token.granularity),
        registryAddr
      )
      .send({
        from: accounts[0],
        gas: 4600000,
      });
  };

  after(async function() {
    await web3.currentProvider.connection.close();
  });

  beforeEach(async function() {
    Erc820Registry = await Erc820Registry.deploy({
      arguments: [accounts[0]],
    }).send({
      from: accounts[0],
      gas: 4600000,
    });

    UnstructuredOwnedUpgradeabilityProxy = new web3.eth.Contract(
      OldUnstructuredOwnedUpgradeabilityProxy.abi,
      {
        data: OldUnstructuredOwnedUpgradeabilityProxy.bytecode,
        arguments: [Erc820Registry.options.address],
      }
    );

    UnstructuredOwnedUpgradeabilityProxy = await UnstructuredOwnedUpgradeabilityProxy.deploy(
      {
        arguments: [Erc820Registry.options.address],
      }
    ).send({
      from: accounts[0],
      gas: 4600000,
    });
    await Erc820Registry.methods
      .setProxy(
        UnstructuredOwnedUpgradeabilityProxy.options.address,
        'KPX',
        true
      )
      .send({
        from: accounts[0],
        gas: 4600000,
      });

    // // Use Web3.js 1.0
    const estimateGas = await deployContract.estimateGas();
    token.contract = await deployContract.send({
      from: accounts[0],
      gasLimit: estimateGas,
    });

    const tokenInitParamTypes = [
      'string',
      'string',
      'uint256',
      'address',
      'address',
    ];
    const tokenInitParamVals = [
      'KryptoX',
      'KPX',
      web3.utils.toWei('0.01'),
      Erc820Registry.options.address,
      accounts[0],
    ];
    const initializeData = encodeCall(
      'initialize',
      tokenInitParamTypes,
      tokenInitParamVals
    );
    await UnstructuredOwnedUpgradeabilityProxy.methods
      .upgradeToAndCall(
        'KPX',
        '0_1_0',
        token.contract.options.address,
        initializeData
      )
      .send({
        from: accounts[0],
        gasLimit: estimateGas,
      });

    token.contract = new web3.eth.Contract(
      OldReferenceToken.abi,
      UnstructuredOwnedUpgradeabilityProxy.options.address,
      {
        data: OldReferenceToken.bytecode,
      }
    );

    assert.ok(token.contract.options.address);

    token.disableERC20 = async function() {
      await token.contract.methods
        .disableERC20()
        .send({ gas: 300000, from: accounts[0] });
    };

    token.genMintTxForAccount = function(account, amount, operator, gas) {
      return token.contract.methods
        .mint(account, web3.utils.toWei(amount), '0xcafe')
        .send.request({ gas: gas, from: operator });
    };
  });

  describe('Creation', function() {
    it('should not be able to initalize the token again', async function() {
      await token.contract.methods
        .initialize(
          token.name,
          token.symbol,
          web3.utils.toWei(token.granularity),
          Erc820Registry.options.address,
          accounts[0]
        )
        .send({ gas: 300000, from: accounts[0] })
        .should.be.rejectedWith('revert');
    });
  });

  require('./utils/attributes').test(web3, accounts, token);
  require('./utils/mint').test(web3, accounts, token);
  require('./utils/burn').test(web3, accounts, token);
  require('./utils/send').test(web3, accounts, token);
  require('./utils/operator').test(web3, accounts, token);
  require('./utils/tokensSender').test(web3, accounts, token);
  require('./utils/tokensRecipient').test(web3, accounts, token);
  require('./utils/erc20Compatibility').test(web3, accounts, token);
  require('./utils/pause').test(web3, accounts, token);
  require('./utils/lockAndDistribute').test(web3, accounts, token);

  describe('ERC20 Disable', function() {
    it('should disable ERC20 compatibility', async function() {
      let erc820Registry = utils.getERC820Registry(
        web3,
        Erc820Registry.options.address
      );
      let erc20Hash = web3.utils.keccak256('ERC20Token');
      let erc20Addr = await erc820Registry.methods
        .getInterfaceImplementer(token.contract.options.address, erc20Hash)
        .call();

      assert.strictEqual(erc20Addr, token.contract.options.address);

      await token.disableERC20();
      console.log(accounts[0], await token.contract.methods.owner().call());
      await utils.getBlock(web3);
      erc20Addr = await erc820Registry.methods
        .getInterfaceImplementer(token.contract.options.address, erc20Hash)
        .call();

      assert.strictEqual(
        erc20Addr,
        '0x0000000000000000000000000000000000000000'
      );
    });
  });

  require('./utils/erc20Disabled').test(web3, accounts, token);
});
