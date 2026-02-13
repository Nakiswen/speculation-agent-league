// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SALToken
 * @notice ERC20 token with staking & voting power for Speculation Agent League
 */
contract SALToken is ERC20, Ownable, Pausable {
    mapping(address => uint256) public stakedAmount;
    uint256 public totalStaked;
    uint256 public stakingMultiplier = 100; // basis points, 100 = 1x

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event SlashApplied(address indexed agent, uint256 amount);

    constructor() ERC20("Speculation Agent League", "SAL") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000_000 * 1e18); // 1B initial supply
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function stake(uint256 amount) external whenNotPaused {
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, address(this), amount);
        stakedAmount[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external whenNotPaused {
        require(amount > 0, "Cannot unstake 0");
        require(stakedAmount[msg.sender] >= amount, "Insufficient staked");
        stakedAmount[msg.sender] -= amount;
        totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function getVotingPower(address user) external view returns (uint256) {
        return (stakedAmount[user] * stakingMultiplier) / 100;
    }

    function setStakingMultiplier(uint256 _multiplier) external onlyOwner {
        stakingMultiplier = _multiplier;
        
    }

    /// @notice Slash agent stake (called by league contract)
    function slash(address agent, uint256 amount) external onlyOwner {
        uint256 slashable = stakedAmount[agent];
        uint256 actual = amount > slashable ? slashable : amount;
        if (actual > 0) {
            stakedAmount[agent] -= actual;
            totalStaked -= actual;
            _burn(address(this), actual);
            emit SlashApplied(agent, actual);
        }
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
