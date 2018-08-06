//const { getLatestVersionFromFs } = require('./contracts');

const contractRegistryConfig = async (root, artifacts, admin) => ({
  contractName: 'ContractRegistry',
  initParamTypes: ['address'],
  initParamVals: [admin],
  registry: root.address,
});

const kpxConfig = async (root, artifacts, admin) =>
  contractRegistryConfig(root, artifacts, admin).then(
    async contractRegistry => ({
      contractName: 'KPX',
      initParamTypes: ['string', 'string', 'uint256', 'address', 'address'],
      initParamVals: ['KryptoX', 'KPX', 1, root.address, admin],
      registry: root.address,
    })
  );

module.exports = {
  contractRegistryConfig,
  kpxConfig,
};
