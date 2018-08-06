pragma solidity ^0.4.24;
import "../lifecycle/Pausable.sol";
import "../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title ContributionLedger
 */
contract ContributionLedger is Pausable {
  using SafeMath for uint256;

  mapping(address => contribution[]) tokenEstimates;
  struct contribution {
    uint256 contributionAmount;
    uint256 estimatedTokens;
    uint256 time;
    uint256 rate;
    bool setByOwner;
  }
  uint256 private currentRate;

  constructor(uint256 rate) public {
    currentRate = rate;
  }

  function setRate(uint256 rate) public onlyOwner {
    currentRate = rate;
  }

  function getRate() public view returns(uint256){
    return currentRate;
  }

  function getContribution(address contributor, uint index) public view returns(uint256,uint256,uint256,uint256, bool) {
    return (
      tokenEstimates[contributor][index].contributionAmount,
      tokenEstimates[contributor][index].estimatedTokens,
      tokenEstimates[contributor][index].time,
      tokenEstimates[contributor][index].rate,
      tokenEstimates[contributor][index].setByOwner
    );
  }

  function getTokenEstimateForContributor(address contributor) public view returns(uint256) {
    uint256 totalKPX = 0;
    for(uint i = 0; i < tokenEstimates[contributor].length; i++){
      totalKPX = totalKPX.add(tokenEstimates[contributor][i].estimatedTokens);
    }
    return totalKPX;
  }

  function getContributionCount(address contributor) public view returns(uint256) {
    return tokenEstimates[contributor].length;
  }

  /**
  * @dev Fallback function allowing to perform a delegatecall to the given implementation.
  * This function will return whatever the implementation call returns
  */
  function () public payable {
    owner().transfer(msg.value);
    contribution memory newContribution = contribution({
      contributionAmount: msg.value,
      estimatedTokens: msg.value.mul(currentRate),
      // solium-disable-next-line security/no-block-members
      time: block.timestamp,
      rate: currentRate,
      setByOwner: false
    });
    tokenEstimates[msg.sender].push(newContribution);
  }

  function setContribution(address contributor, uint etherContributed, uint256 rate) public onlyOwner {
    contribution memory newContribution = contribution({
      contributionAmount: etherContributed,
      estimatedTokens: etherContributed.mul(rate),
      // solium-disable-next-line security/no-block-members
      time: block.timestamp,
      rate: rate,
      setByOwner: true
    });
    tokenEstimates[contributor].push(newContribution);
  }
}