const ContributionLedger = artifacts.require('ContributionLedger');
const Web3 = require('web3');

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    web3 = new Web3(web3.currentProvider);
    await deployer.deploy(ContributionLedger, 10250, {
      from: '0x1c128de6b93557651e0dc5b55f23496ffac7a0a9',
    });
  });
};
