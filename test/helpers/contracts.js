const encodeCall = require('./utils').encodeCall;
const { mapSeries } = require('bluebird');
const glob = require('glob');
const path = require('path');

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
    gasPrice: 10000000000, // 10 gwei
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

  const contractToMakeUpgradeable = await contract.new();

  if (initializeParams) {
    const initializeData = encodeCall(
      'initialize',
      initializeParams[0], // ex: ['string', 'string', 'uint', 'uint', 'address', 'address'],
      initializeParams[1] // ex ["KryptoX", "KPX", ...]
    );

    await registry.setProxy(proxy.address, 'KPX', true);

    await proxy.upgradeToAndCall(
      contractName,
      versionName,
      contractToMakeUpgradeable.address,
      initializeData,
      deployParams
    );
  } else {
    await proxy.upgradeTo(
      contractName,
      versionName,
      contractToMakeUpgradeable.address,
      deployParams
    );
  }
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
