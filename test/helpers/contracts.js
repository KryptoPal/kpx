const encodeCall = require('./utils').encodeCall;

const { promisify } = require('util');
const { mapSeries } = require('bluebird');
const glob = require('glob');
const path = require('path');
const utils = require('./utils');

const parseContractName = contractName => {
  const [, name, version] = contractName.match(/^(.*)V([^V]+)$/);
  return [name, version];
};

const deployUpgradeableContract = async (
  artifacts,
  passedProxy = null,
  contract,
  registry,
  initializeParams,
  deployParams = {
    gas: 5219725,
    from: '0x1c128de6b93557651e0dc5b55f23496ffac7a0a9',
    gasPrice: 0x0a,
  }
) => {
  const [contractName, versionName] = parseContractName(contract.contractName);
  const contractRegistry =
    registry ||
    (await artifacts.require('RootRegistryV0_1_0').new(deployParams));
  // use a proxy already existing in the testrpc or deploy a new one
  // (useful for testing multi upgrade scenarios)
  const proxy =
    passedProxy ||
    (await artifacts
      .require('UnstructuredOwnedUpgradeabilityProxy')
      .new(contractRegistry.address, deployParams));

  //console.log('deployed proxy succesfully...');

  //console.log('contractToMakeUpgradeable', deployParams);
  const contractToMakeUpgradeable = await contract.new();
  //console.log('deployed contractToMakeUpgradeable succesfully...');

  if (initializeParams) {
    const initializeData = encodeCall(
      'initialize',
      initializeParams[0], // ex: ['string', 'string', 'uint', 'uint', 'address', 'address'],
      initializeParams[1] // ex: ['Upgradeable NORI Token', 'NORI', 1, 0, contractRegistry.address, admin]
    );
    //console.log('setting proxy', proxy.address);

    await registry.setProxy(proxy.address, 'KPX', true);
    //console.log(' proxy set! upgradeAndCall', initializeParams);

    await proxy.upgradeToAndCall(
      contractName,
      versionName,
      contractToMakeUpgradeable.address,
      initializeData,
      deployParams
    );
  } else {
    //console.log('upgradeTo begin..');
    await proxy.upgradeTo(
      contractName,
      versionName,
      contractToMakeUpgradeable.address,
      deployParams
    );
    //console.log('upgradeTo complete');
  }
  //console.log('getting contract At', proxy.address);
  const upgradeableContractAtProxy = await contract.at(
    proxy.address,
    deployParams
  );
  return {
    contractToMakeUpgradeable,
    upgradeableContractAtProxy,
    proxy,
    contractRegistry,
    contractName,
    versionName,
  };
};

const getLatestVersionFromFs = async contractName => {
  const dir = path.join(__dirname, '../../contracts/');
  let latestVersion = '0_0_0';
  return new Promise(res => {
    glob(`${dir}/**/?(${contractName}?(V[0-9]*)).sol`, {}, (er, files) => {
      files.forEach(file => {
        const [latestMajor, latestMinor, latestPatch] = latestVersion.split(
          '_'
        );
        let [, versionToCompare] = parseContractName(file);
        versionToCompare = versionToCompare.split('.')[0];
        const [major, minor, patch] = versionToCompare.split('_');
        if (parseInt(major, 10) > parseInt(latestMajor, 10)) {
          latestVersion = versionToCompare;
        } else if (
          parseInt(major, 10) === parseInt(latestMajor, 10) &&
          parseInt(minor, 10) > parseInt(latestMinor, 10)
        ) {
          latestVersion = versionToCompare;
        } else if (
          parseInt(major, 10) === parseInt(latestMajor, 10) &&
          parseInt(minor, 10) === parseInt(latestMinor, 10) &&
          parseInt(patch, 10) > parseInt(latestPatch, 10)
        ) {
          latestVersion = versionToCompare;
        }
      });
      res(latestVersion);
    });
  });
};

const upgradeAndMigrateContracts = (
  { network, artifacts, accounts, web3 },
  adminAccountAddress,
  contractsToUpgrade, // <- pass these in the correct order; they may depend on eachother
  multiAdmin,
  root
) => {
  //console.log('accounts[0]', accounts[0]);
  return mapSeries(contractsToUpgrade, async contractConfig => {
    const {
      contractName,
      initParamTypes,
      initParamVals,
      registry,
    } = await contractConfig(
      root,
      artifacts,
      '0x1c128de6b93557651e0dc5b55f23496ffac7a0a9'
    );
    const version = await getLatestVersionFromFs(contractName);

    // console.log(
    //   'deployUpgradeableContract...',
    //   root.address,
    //   contractName,
    //   version
    // );

    return deployUpgradeableContract(
      artifacts,
      null,
      artifacts.require(`${contractName}V${version}`),
      root,
      [initParamTypes, initParamVals]
    );
  });
};

module.exports = {
  getLatestVersionFromFs,
  upgradeAndMigrateContracts,
};
