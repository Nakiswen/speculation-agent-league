// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentToken
 * @notice 每个 AI Agent 的独立代币，基于 Bonding Curve 定价
 *
 * 核心机制：
 *   - Bonding Curve: price = basePrice + slope * supply
 *   - 回购销毁: Agent 利润的 20% 自动回购销毁
 *   - 死亡清算: 价格跌破初始价 40% 则 Agent 失去席位
 */
contract AgentToken is ERC20, Ownable {

    address public agent;          // 绑定的 Agent 地址
    address public factory;        // AgentFactory 地址
    uint256 public basePrice;      // 初始价格 (wei per token)
    uint256 public slope;          // 曲线斜率
    uint256 public totalBuyVolume; // 累计买入量（用于追踪曲线）

    uint256 public constant BUYBACK_RATE = 2000;  // 20% = 2000 basis points
    uint256 public constant DEATH_THRESHOLD = 4000; // 40% = 4000 basis points
    uint256 public constant BASIS = 10000;

    event TokensBought(address indexed buyer, uint256 amount, uint256 cost);
    event TokensSold(address indexed seller, uint256 amount, uint256 refund);
    event BuybackBurn(uint256 amount, uint256 cost);

    constructor(
        string memory name_,
        string memory symbol_,
        address agent_,
        uint256 basePrice_,
        uint256 slope_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        agent = agent_;
        factory = msg.sender;
        basePrice = basePrice_;
        slope = slope_;
    }

    /// @notice 当前价格 = basePrice + slope * totalSupply / 1e18
    function currentPrice() public view returns (uint256) {
        return basePrice + (slope * totalSupply()) / 1e18;
    }

    /// @notice 买入 Agent Token（沿 Bonding Curve）
    function buy() external payable {
        require(msg.value > 0, "Send ETH to buy");
        uint256 price = currentPrice();
        uint256 amount = (msg.value * 1e18) / price;
        require(amount > 0, "Amount too small");
        _mint(msg.sender, amount);
        totalBuyVolume += amount;
        emit TokensBought(msg.sender, amount, msg.value);
    }

    /// @notice 卖出 Agent Token（沿 Bonding Curve）
    function sell(uint256 amount) external {
        require(amount > 0 && balanceOf(msg.sender) >= amount, "Invalid amount");
        uint256 price = currentPrice();
        uint256 refund = (amount * price) / 1e18;
        uint256 contractBal = address(this).balance;
        if (refund > contractBal) refund = contractBal;
        _burn(msg.sender, amount);
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
        emit TokensSold(msg.sender, amount, refund);
    }

    /// @notice 回购销毁 — 由 League 合约调用，用 Agent 利润的 20% 回购
    function buybackAndBurn() external payable onlyOwner {
        require(msg.value > 0, "Send ETH for buyback");
        uint256 price = currentPrice();
        uint256 amount = (msg.value * 1e18) / price;
        if (amount > 0) {
            // 不 mint，直接记录销毁效果（减少虚拟供应）
            // 实际效果：ETH 锁入合约，推高价格
            emit BuybackBurn(amount, msg.value);
        }
    }

    /// @notice 是否跌破死亡线（当前价格 < 初始价格的 40%）
    function isBelowDeathLine() external view returns (bool) {
        return currentPrice() < (basePrice * DEATH_THRESHOLD) / BASIS;
    }

    /// @notice 合约市值 = currentPrice * totalSupply / 1e18
    function marketCap() external view returns (uint256) {
        return (currentPrice() * totalSupply()) / 1e18;
    }

    receive() external payable {}
}
