pragma solidity ^0.4.24;
import "./VersionRegistry.sol";
import "../eip820/ERC820Registry.sol";
import "../ownership/UnstructuredOwnable.sol";
import "./IVersionRegistry.sol";


/// @title ContractRegistryBase
/// @dev defines the base registry function sets for future versions to inherit from
contract ContractRegistryBase is UnstructuredOwnable, VersionRegistry, ERC820Registry, IVersionRegistry { 

  event Initialized(address owner);
  
  bool internal _initialized;
  
  /**
   * @dev Throws if called by any account other than the owner or proxy
   */
  modifier onlyOwnerOrProxy(string contractName) {
    require(msg.sender == owner() || msg.sender == getLatestProxyAddr(contractName));
    _;
  }
  

  function setProxy(address proxyAddr, string contractName, bool override) public onlyOwner {
    if(!override) {
      require(proxyContracts[keccak256(abi.encodePacked(contractName))] != address(0));
    }
    proxyContracts[keccak256(abi.encodePacked(contractName))] = proxyAddr;
  }

  function initialize(address owner) public onlyOwner {
    require(_initialized != true);
    setOwner(owner);
    _initialized = true;
    emit Initialized(owner);
  }

  /**
    @dev returns the current initalization status
  */
  function initialized() public view returns(bool) {
    return _initialized;
  }

  function setVersion(
    string contractName, 
    address proxyAddress, 
    string versionName, 
    address newImplementation
  ) public onlyOwnerOrProxy(contractName) {
    _setVersion(
      contractName, 
      proxyAddress, 
      versionName, 
      newImplementation
    );
  }

}
