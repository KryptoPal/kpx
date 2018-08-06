const { upgradeAndMigrateContracts } = require('../test/helpers/contracts');
const { kpxConfig } = require('../test/helpers/contractConfigs');
const RootRegistryV0_1_0 = artifacts.require('RootRegistryV0_1_0');
const Web3 = require('web3');

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    // web3 = new Web3(web3.currentProvider);
    // const config = {
    //   network,
    //   artifacts,
    //   web3,
    //   accounts,
    //   deployer,
    // };
    // const root = await deployer.deploy(
    //   RootRegistryV0_1_0,
    //   '0x1c128de6b93557651e0dc5b55f23496ffac7a0a9',
    //   { gasPrice: 20000000000 }
    // );
    // const contractsToUpgrade = [kpxConfig];
    // const deployedContracts = await upgradeAndMigrateContracts(
    //   config,
    //   '0x1c128de6b93557651e0dc5b55f23496ffac7a0a9',
    //   contractsToUpgrade,
    //   '0x1c128de6b93557651e0dc5b55f23496ffac7a0a9',
    //   root
    // );
    // const kpx = deployedContracts[0];
    // console.log(
    //   'kpx.upgradeableContractAtProxy.address:',
    //   kpx.upgradeableContractAtProxy.address
    // );
  });
};

// module.exports = (deployer, network) => {
//   deployer.then(async () => {
//     global.network = network;
//     // yeah we won't be using this...
//   });
// };

//const { upgradeAndMigrateContracts } = require('../test/helpers/contracts');
// const { kpxConfig } = require('../test/helpers/contractConfigs');
// const RootRegistryV0_1_0 = artifacts.require('RootRegistryV0_1_0');
// const Web3 = require('web3');

// module.exports = (deployer, network, accounts) => {
//   deployer.then(async () => {
//     web3 = new Web3(web3.currentProvider);
//     console.log(accounts[0]);

//     const config = {
//       network,
//       artifacts,
//       web3,
//       accounts,
//       deployer,
//     };
//     const root = await deployer.deploy(RootRegistryV0_1_0, accounts[0]);

//     const contractsToUpgrade = [kpxConfig];
//     const deployedContracts = await upgradeAndMigrateContracts(
//       config,
//       '0x1c128de6b93557651e0dc5b55f23496ffac7a0a9',
//       contractsToUpgrade,
//       '0x1c128de6b93557651e0dc5b55f23496ffac7a0a9',
//       root
//     );
//     const kpx = deployedContracts[0];
//     console.log(
//       'kpx.upgradeableContractAtProxy.address',
//       kpx.upgradeableContractAtProxy.address
//     );
//   });
// };

// // module.exports = (deployer, network) => {
// //   deployer.then(async () => {
// //     global.network = network;
// //     // yeah we won't be using this...
// //   });
// // };
