// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentToken.sol";

/**
 * @title AgentFactory
 * @notice Agent 工厂 — 一键部署 Agent + 专属 Token + Bonding Curve
 *
 * 流程：
 *   1. 开发者调用 createAgent() 提交策略信息
 *   2. 工厂自动部署 AgentToken (ERC-20)
 *   3. Token 基于 Bonding Curve 自动定价
 */
contract AgentFactory is Ownable {

    struct AgentInfo {
        address agent;           // Agent 钱包地址
        address token;           // Agent Token 合约地址
        string name;             // Agent 名称
        string symbol;           // Token 符号
        uint256 createdAt;
        bool alive;              // 是否存活（未被死亡清算）
    }

    mapping(address => AgentInfo) public agentInfo;   // agent address → info
    mapping(address => address) public tokenToAgent;   // token address → agent
    address[] public allAgents;

    uint256 public defaultBasePrice = 0.001 ether;     // 初始价格
    uint256 public defaultSlope = 0.0001 ether;        // 曲线斜率

    address public league;  // League 合约地址

    event AgentCreated(address indexed agent, address indexed token, string name, string symbol);
    event AgentKilled(address indexed agent, address indexed token);

    constructor() Ownable(msg.sender) {}

    function setLeague(address _league) external onlyOwner {
        league = _league;
    }

    function setDefaultPricing(uint256 _basePrice, uint256 _slope) external onlyOwner {
        defaultBasePrice = _basePrice;
        defaultSlope = _slope;
    }

    /// @notice 创建 Agent 并部署专属 Token
    function createAgent(
        address agent,
        string calldata name,
        string calldata symbol
    ) external returns (address tokenAddr) {
        require(agentInfo[agent].agent == address(0), "Agent already exists");

        AgentToken token = new AgentToken(
            name,
            symbol,
            agent,
            defaultBasePrice,
            defaultSlope
        );
        // 将 token 的 owner 设为 league（允许 league 调用 buybackAndBurn）
        if (league != address(0)) {
            token.transferOwnership(league);
        }

        tokenAddr = address(token);
        agentInfo[agent] = AgentInfo({
            agent: agent,
            token: tokenAddr,
            name: name,
            symbol: symbol,
            createdAt: block.timestamp,
            alive: true
        });
        tokenToAgent[tokenAddr] = agent;
        allAgents.push(agent);

        emit AgentCreated(agent, tokenAddr, name, symbol);
    }

    /// @notice 死亡清算 — Token 价格跌破初始价 40%
    function killAgent(address agent) external {
        AgentInfo storage info = agentInfo[agent];
        require(info.alive, "Already dead");
        AgentToken token = AgentToken(payable(info.token));
        require(token.isBelowDeathLine(), "Price above death line");
        info.alive = false;
        emit AgentKilled(agent, info.token);
    }

    function getAgentToken(address agent) external view returns (address) {
        return agentInfo[agent].token;
    }

    function isAgentAlive(address agent) external view returns (bool) {
        return agentInfo[agent].alive;
    }

    function getAgentCount() external view returns (uint256) {
        return allAgents.length;
    }

    receive() external payable {}
}
