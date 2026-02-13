// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SALToken.sol";
import "./AgentFactory.sol";
import "./AgentToken.sol";

/**
 * @title SpeculationAgentLeague
 * @notice 核心任务引擎 — 基于真实市场模拟的 Agent 竞技场
 *
 * 三种任务类型：
 *   Arbitrage   — 预测价格方向（多/空），盈亏 = |预测偏差| 决定
 *   Liquidation — 判断是否应清算（bool），正确获奖，错误扣罚
 *   Rebalance   — 提交目标比例，偏差越小盈亏越高
 *
 * 评分公式（PRD）：Score = ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1
 */
contract SpeculationAgentLeague is Ownable, Pausable, ReentrancyGuard {

    // ── 枚举 ──────────────────────────────────────────
    enum TaskType { Arbitrage, Liquidation, Rebalance }

    // ── 结构体 ────────────────────────────────────────
    struct Epoch {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        bool closed;
    }

    struct Task {
        uint256 taskId;
        uint256 epochId;
        TaskType taskType;
        uint256 createdAt;
        bool resolved;
        address winner;
        // Arbitrage: 实际价格变动（正=涨，负=跌）
        int256 actualPriceMove;
        // Liquidation: 实际是否应清算
        bool shouldLiquidate;
        // Rebalance: 最优目标比例 (0-100)
        uint256 optimalRatio;
    }

    struct AgentStats {
        bool registered;
        int256 totalProfit;       // 累计盈亏 (wei)
        uint256 successCount;
        uint256 failCount;
        uint256 totalResponseTime;
        uint256 activeStake;
        uint256 lastExecutionEpoch;
        int256 initialCapital;    // 初始资本（注册时快照）
        int256 peakProfit;        // 历史最高盈利
        int256 worstDrawdown;     // 最大回撤
        uint256 consecutiveLosses; // 连续亏损次数
    }

    // ── 状态变量 ──────────────────────────────────────
    SALToken public salToken;
    AgentFactory public agentFactory;

    uint256 public currentEpochId;
    uint256 public epochDuration = 30;
    uint256 public taskTimeWindow = 25;
    uint256 public baseReward = 100 * 1e18;
    uint256 public maxExecutionFrequency = 5; // 每 epoch 最大执行次数
    uint256 public constant BUYBACK_RATE = 2000; // 20% 利润用于回购销毁 Agent Token

    mapping(uint256 => Epoch) public epochs;
    mapping(uint256 => Task) public tasks;
    uint256 public taskCounter;

    mapping(address => AgentStats) public agentStats;
    address[] public registeredAgents;

    mapping(uint256 => uint256[]) public epochTasks;
    mapping(uint256 => mapping(address => bool)) public taskExecutions;
    mapping(uint256 => mapping(address => uint256)) public epochExecutionCount;
    mapping(uint256 => mapping(address => int256)) public epochProfitByAgent;

    // ── 事件 ──────────────────────────────────────────
    event EpochStarted(uint256 indexed epochId, uint256 startTime);
    event EpochClosed(uint256 indexed epochId, uint256 endTime);
    event TaskCreated(uint256 indexed taskId, uint256 indexed epochId, TaskType taskType);
    event TaskExecuted(uint256 indexed taskId, address indexed agent, bool success, int256 profit);
    event AgentRegistered(address indexed agent, address indexed agentToken);
    event BuybackExecuted(address indexed agent, address indexed agentToken, uint256 ethAmount);

    // ── 修饰符 ────────────────────────────────────────
    modifier onlyRegistered() {
        require(agentStats[msg.sender].registered, "Not registered");
        require(agentFactory.isAgentAlive(msg.sender), "Agent is dead");
        _;
    }

    modifier epochActive() {
        Epoch storage e = epochs[currentEpochId];
        require(!e.closed && block.timestamp <= e.startTime + epochDuration, "Epoch not active");
        _;
    }

    // ── 构造函数 ──────────────────────────────────────
    constructor(address _salToken, address _agentFactory) Ownable(msg.sender) {
        salToken = SALToken(_salToken);
        agentFactory = AgentFactory(payable(_agentFactory));
    }

    // ── Agent 注册 ────────────────────────────────────
    function registerAgent() external {
        require(!agentStats[msg.sender].registered, "Already registered");
        // 检查 Agent 是否已在 Factory 中创建了 Token
        address tokenAddr = agentFactory.getAgentToken(msg.sender);
        require(tokenAddr != address(0), "Create agent token first");
        require(agentFactory.isAgentAlive(msg.sender), "Agent is dead");

        agentStats[msg.sender].registered = true;
        agentStats[msg.sender].initialCapital = int256(salToken.balanceOf(msg.sender));
        registeredAgents.push(msg.sender);
        emit AgentRegistered(msg.sender, tokenAddr);
    }

    // ── Epoch 管理 ────────────────────────────────────

    /**
     * @notice 开启新 Epoch，由 owner 提供市场数据
     * @param priceMoves  三个价格变动值（用于 Arbitrage 任务）
     * @param liquidateFlags 三个清算标记（用于 Liquidation 任务）
     * @param optimalRatios 三个最优比例（用于 Rebalance 任务）
     */
    function startEpochWithData(
        int256[3] calldata priceMoves,
        bool[3] calldata liquidateFlags,
        uint256[3] calldata optimalRatios
    ) external onlyOwner whenNotPaused {
        if (currentEpochId > 0) {
            require(epochs[currentEpochId].closed, "Previous epoch not closed");
        }
        currentEpochId++;
        epochs[currentEpochId] = Epoch({
            id: currentEpochId,
            startTime: block.timestamp,
            endTime: 0,
            closed: false
        });

        // 每种任务类型各创建一个
        _createArbitrageTask(currentEpochId, priceMoves[0]);
        _createLiquidationTask(currentEpochId, liquidateFlags[0]);
        _createRebalanceTask(currentEpochId, optimalRatios[0]);

        emit EpochStarted(currentEpochId, block.timestamp);
    }

    /// @notice 简化版 startEpoch（使用伪随机数据，向后兼容）
    function startEpoch() external onlyOwner whenNotPaused {
        if (currentEpochId > 0) {
            require(epochs[currentEpochId].closed, "Previous epoch not closed");
        }
        currentEpochId++;
        epochs[currentEpochId] = Epoch({
            id: currentEpochId,
            startTime: block.timestamp,
            endTime: 0,
            closed: false
        });

        uint256 seed = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1), currentEpochId
        )));

        _createArbitrageTask(currentEpochId, int256(seed % 200) - 100);
        _createLiquidationTask(currentEpochId, (seed >> 8) % 2 == 1);
        _createRebalanceTask(currentEpochId, (seed >> 16) % 100);

        emit EpochStarted(currentEpochId, block.timestamp);
    }

    function closeEpoch() external onlyOwner {
        Epoch storage e = epochs[currentEpochId];
        require(!e.closed, "Already closed");
        e.endTime = block.timestamp;
        e.closed = true;
        _distributeTopRewards(currentEpochId);
        _executeBuybacks(currentEpochId);
        emit EpochClosed(currentEpochId, block.timestamp);
    }

    // ── 任务创建（内部）────────────────────────────────

    function _createArbitrageTask(uint256 epochId, int256 priceMove) internal {
        taskCounter++;
        tasks[taskCounter] = Task({
            taskId: taskCounter,
            epochId: epochId,
            taskType: TaskType.Arbitrage,
            createdAt: block.timestamp,
            resolved: false,
            winner: address(0),
            actualPriceMove: priceMove,
            shouldLiquidate: false,
            optimalRatio: 0
        });
        epochTasks[epochId].push(taskCounter);
        emit TaskCreated(taskCounter, epochId, TaskType.Arbitrage);
    }

    function _createLiquidationTask(uint256 epochId, bool shouldLiq) internal {
        taskCounter++;
        tasks[taskCounter] = Task({
            taskId: taskCounter,
            epochId: epochId,
            taskType: TaskType.Liquidation,
            createdAt: block.timestamp,
            resolved: false,
            winner: address(0),
            actualPriceMove: 0,
            shouldLiquidate: shouldLiq,
            optimalRatio: 0
        });
        epochTasks[epochId].push(taskCounter);
        emit TaskCreated(taskCounter, epochId, TaskType.Liquidation);
    }

    function _createRebalanceTask(uint256 epochId, uint256 optimal) internal {
        taskCounter++;
        tasks[taskCounter] = Task({
            taskId: taskCounter,
            epochId: epochId,
            taskType: TaskType.Rebalance,
            createdAt: block.timestamp,
            resolved: false,
            winner: address(0),
            actualPriceMove: 0,
            shouldLiquidate: false,
            optimalRatio: optimal
        });
        epochTasks[epochId].push(taskCounter);
        emit TaskCreated(taskCounter, epochId, TaskType.Rebalance);
    }

    // ── 任务执行 ──────────────────────────────────────

    /**
     * @notice 执行套利任务
     * @param taskId 任务 ID
     * @param predictedMove Agent 预测的价格变动方向和幅度
     *
     * 盈亏计算：
     *   Profit_per_task = task_reward * success_flag
     *   方向正确（同号）=> success_flag = 1，计入奖励
     *   方向错误 => success_flag = 0，收益为 0
     */
    function executeArbitrage(uint256 taskId, int256 predictedMove)
        external onlyRegistered epochActive nonReentrant whenNotPaused
    {
        Task storage t = tasks[taskId];
        require(t.taskType == TaskType.Arbitrage, "Wrong type");
        _preCheck(taskId);

        int256 actual = t.actualPriceMove;
        // 方向正确 = 同号（都正或都负）
        bool directionCorrect = (predictedMove > 0 && actual > 0) || (predictedMove < 0 && actual < 0);
        // 精确度：偏差越小越好
        uint256 deviation = _abs(predictedMove - actual);

        if (directionCorrect) {
            // 偏差越小，奖励越高（最高 100%，最低 10%）
            uint256 accuracy = deviation < 200 ? 200 - deviation : 0;
            uint256 rewardPct = 10 + (accuracy * 90) / 200; // 10% ~ 100%
            _settleSuccess(taskId, rewardPct);
        } else {
            _settleFail(taskId);
        }
    }

    /**
     * @notice 执行清算任务
     * @param taskId 任务 ID
     * @param shouldLiquidate Agent 判断是否应该清算
     *
     * 判断正确获奖，错误扣罚
     */
    function executeLiquidation(uint256 taskId, bool shouldLiquidate)
        external onlyRegistered epochActive nonReentrant whenNotPaused
    {
        Task storage t = tasks[taskId];
        require(t.taskType == TaskType.Liquidation, "Wrong type");
        _preCheck(taskId);

        if (shouldLiquidate == t.shouldLiquidate) {
            _settleSuccess(taskId, 80); // 正确判断给 80% 奖励
        } else {
            _settleFail(taskId);
        }
    }

    /**
     * @notice 执行再平衡任务
     * @param taskId 任务 ID
     * @param proposedRatio Agent 提交的目标比例 (0-100)
     *
     * 偏差 <= 5: 满额奖励
     * 偏差 <= 15: 部分奖励
     * 偏差 > 15: 失败扣罚
     */
    function executeRebalance(uint256 taskId, uint256 proposedRatio)
        external onlyRegistered epochActive nonReentrant whenNotPaused
    {
        Task storage t = tasks[taskId];
        require(t.taskType == TaskType.Rebalance, "Wrong type");
        _preCheck(taskId);

        uint256 diff = proposedRatio > t.optimalRatio
            ? proposedRatio - t.optimalRatio
            : t.optimalRatio - proposedRatio;

        if (diff <= 5) {
            _settleSuccess(taskId, 100); // 精确匹配，满额
        } else if (diff <= 15) {
            uint256 pct = 100 - (diff - 5) * 8; // 60% ~ 100%
            _settleSuccess(taskId, pct);
        } else {
            _settleFail(taskId);
        }
    }

    // ── 内部结算逻辑 ─────────────────────────────────

    function _preCheck(uint256 taskId) internal {
        Task storage t = tasks[taskId];
        require(block.timestamp <= epochs[t.epochId].startTime + taskTimeWindow, "Time window closed");
        require(!taskExecutions[taskId][msg.sender], "Already executed");
        require(epochExecutionCount[t.epochId][msg.sender] < maxExecutionFrequency, "Max frequency");

        taskExecutions[taskId][msg.sender] = true;
        epochExecutionCount[t.epochId][msg.sender]++;
    }

    function _settleSuccess(uint256 taskId, uint256 rewardPct) internal {
        Task storage t = tasks[taskId];
        AgentStats storage stats = agentStats[msg.sender];

        // task_reward（按任务奖励比例）
        uint256 reward = (baseReward * rewardPct) / 100;
        if (reward == 0) reward = baseReward / 10;

        int256 profit = int256(reward);
        epochProfitByAgent[t.epochId][msg.sender] += profit;
        stats.totalProfit += profit;
        stats.successCount++;
        stats.consecutiveLosses = 0;
        stats.totalResponseTime += block.timestamp - t.createdAt;
        stats.lastExecutionEpoch = t.epochId;

        // 更新峰值
        if (stats.totalProfit > stats.peakProfit) {
            stats.peakProfit = stats.totalProfit;
        }

        if (!t.resolved) {
            t.resolved = true;
            t.winner = msg.sender;
        }

        // 发放奖励：80% 给 Agent，20% 销毁（模拟回购效果）
        uint256 agentReward = (reward * (10000 - BUYBACK_RATE)) / 10000;
        uint256 buybackPortion = reward - agentReward;

        salToken.mint(msg.sender, agentReward);

        // 回购销毁部分：记录事件，不实际铸造
        address tokenAddr = agentFactory.getAgentToken(msg.sender);
        if (tokenAddr != address(0) && buybackPortion > 0) {
            emit BuybackExecuted(msg.sender, tokenAddr, buybackPortion);
        }

        emit TaskExecuted(taskId, msg.sender, true, profit);
    }

    function _settleFail(uint256 taskId) internal {
        Task storage t = tasks[taskId];
        AgentStats storage stats = agentStats[msg.sender];

        // 失败扣罚：stake 的 0.5%
        uint256 stk = salToken.stakedAmount(msg.sender);
        uint256 penalty = (stk * 5) / 1000;
        if (penalty > 0) {
            salToken.slash(msg.sender, penalty);
        }

        int256 profit = -int256(penalty);
        epochProfitByAgent[t.epochId][msg.sender] += profit;
        stats.totalProfit += profit;
        stats.failCount++;
        stats.consecutiveLosses++;
        stats.totalResponseTime += block.timestamp - t.createdAt;
        stats.lastExecutionEpoch = t.epochId;

        // 更新回撤
        int256 drawdown = stats.peakProfit - stats.totalProfit;
        if (drawdown > stats.worstDrawdown) {
            stats.worstDrawdown = drawdown;
        }

        emit TaskExecuted(taskId, msg.sender, false, profit);
    }

    function _abs(int256 x) internal pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }

    // ── 奖励分配 ─────────────────────────────────────

    function _distributeTopRewards(uint256 epochId) internal {
        uint256 len = registeredAgents.length;
        if (len == 0) return;

        address[3] memory top;
        uint256[3] memory topScores;

        for (uint256 i = 0; i < len; i++) {
            address agent = registeredAgents[i];
            if (epochExecutionCount[epochId][agent] == 0) continue;
            uint256 sc = getAgentScore(agent);
            for (uint256 j = 0; j < 3; j++) {
                if (sc > topScores[j]) {
                    for (uint256 k = 2; k > j; k--) {
                        top[k] = top[k - 1];
                        topScores[k] = topScores[k - 1];
                    }
                    top[j] = agent;
                    topScores[j] = sc;
                    break;
                }
            }
        }

        uint256[3] memory multipliers = [uint256(3), 2, 1];
        for (uint256 i = 0; i < 3; i++) {
            if (top[i] != address(0)) {
                salToken.mint(top[i], baseReward * multipliers[i]);
            }
        }
    }

    /// @notice 回购销毁 — closeEpoch 时检查并触发死亡清算
    function _executeBuybacks(uint256 epochId) internal {
        uint256 len = registeredAgents.length;
        for (uint256 i = 0; i < len; i++) {
            address agent = registeredAgents[i];
            if (epochExecutionCount[epochId][agent] == 0) continue;

            // 检查 Agent Token 是否跌破死亡线
            address tokenAddr = agentFactory.getAgentToken(agent);
            if (tokenAddr == address(0)) continue;
            AgentToken agentToken = AgentToken(payable(tokenAddr));
            if (agentToken.isBelowDeathLine() && agentFactory.isAgentAlive(agent)) {
                // 触发死亡清算
                agentFactory.killAgent(agent);
            }
        }
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    // ── 查询函数 ──────────────────────────────────────

    function getAgentStats(address agent) external view returns (AgentStats memory) {
        return agentStats[agent];
    }

    function getEpochTasks(uint256 epochId) external view returns (uint256[] memory) {
        return epochTasks[epochId];
    }

    function getRegisteredAgentCount() external view returns (uint256) {
        return registeredAgents.length;
    }

    function getEpochProfit(uint256 epochId, address agent) external view returns (int256) {
        return epochProfitByAgent[epochId][agent];
    }

    /**
     * @notice 评分公式：Score = ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1
     * ROI = totalProfit / initialCapital (放大 1e4 精度)
     * Stability = 1 / (1 + worstDrawdown / initialCapital) (放大 1e4)
     * SurvivalBonus = consecutiveLosses < 3 ? 1e4 : 0
     */
    function getAgentScore(address agent) public view returns (uint256) {
        AgentStats memory s = agentStats[agent];
        if (!s.registered) return 0;
        uint256 total = s.successCount + s.failCount;
        if (total == 0) return 0;

        // ROI (放大 1e4)
        int256 capital = s.initialCapital > 0 ? s.initialCapital : int256(1 ether);
        int256 roiRaw = (s.totalProfit * 1e4) / capital;
        uint256 roi = roiRaw > 0 ? uint256(roiRaw) : 0;

        // Stability (放大 1e4): 回撤越小越稳定
        uint256 drawdownRatio = s.worstDrawdown > 0
            ? uint256(s.worstDrawdown) * 1e4 / uint256(capital)
            : 0;
        uint256 stability = drawdownRatio < 1e4
            ? 1e4 - drawdownRatio
            : 0;

        // Survival Bonus
        uint256 survivalBonus = s.consecutiveLosses < 3 ? 1e4 : 0;

        // Score = ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1
        return (roi * 60 + stability * 30 + survivalBonus * 10) / 100;
    }

    function getLeaderboard(uint256 topN) external view returns (address[] memory, uint256[] memory) {
        uint256 len = registeredAgents.length;
        uint256 count = topN < len ? topN : len;

        address[] memory sorted = new address[](len);
        uint256[] memory scores = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            sorted[i] = registeredAgents[i];
            scores[i] = getAgentScore(registeredAgents[i]);
        }

        for (uint256 i = 0; i < count; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < len; j++) {
                if (scores[j] > scores[maxIdx]) maxIdx = j;
            }
            if (maxIdx != i) {
                (sorted[i], sorted[maxIdx]) = (sorted[maxIdx], sorted[i]);
                (scores[i], scores[maxIdx]) = (scores[maxIdx], scores[i]);
            }
        }

        address[] memory topAddrs = new address[](count);
        uint256[] memory topScores = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            topAddrs[i] = sorted[i];
            topScores[i] = scores[i];
        }
        return (topAddrs, topScores);
    }

    // ── 管理函数 ──────────────────────────────────────

    function setEpochDuration(uint256 _duration) external onlyOwner {
        epochDuration = _duration;
    }

    function setTaskTimeWindow(uint256 _window) external onlyOwner {
        taskTimeWindow = _window;
    }

    function setBaseReward(uint256 _reward) external onlyOwner {
        baseReward = _reward;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
