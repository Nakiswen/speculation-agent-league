/** 精简 ABI — 仅包含后端需要调用/监听的函数和事件（新版任务引擎） */

export const LEAGUE_ABI = [
  "function startEpoch() external",
  "function startEpochWithData(int256[3],bool[3],uint256[3]) external",
  "function closeEpoch() external",
  "function currentEpochId() view returns (uint256)",
  "function epochs(uint256) view returns (uint256 id, uint256 startTime, uint256 endTime, bool closed)",
  "function epochDuration() view returns (uint256)",
  "function getAgentStats(address) view returns (tuple(bool registered, int256 totalProfit, uint256 successCount, uint256 failCount, uint256 totalResponseTime, uint256 activeStake, uint256 lastExecutionEpoch, int256 initialCapital, int256 peakProfit, int256 worstDrawdown, uint256 consecutiveLosses))",
  "function getAgentScore(address) view returns (uint256)",
  "function getLeaderboard(uint256) view returns (address[], uint256[])",
  "function getEpochTasks(uint256) view returns (uint256[])",
  "function tasks(uint256) view returns (uint256 taskId, uint256 epochId, uint8 taskType, uint256 createdAt, bool resolved, address winner, int256 actualPriceMove, bool shouldLiquidate, uint256 optimalRatio)",
  "function registeredAgents(uint256) view returns (address)",
  "function getRegisteredAgentCount() view returns (uint256)",
  "event EpochStarted(uint256 indexed epochId, uint256 startTime)",
  "event EpochClosed(uint256 indexed epochId, uint256 endTime)",
  "event TaskCreated(uint256 indexed taskId, uint256 indexed epochId, uint8 taskType)",
  "event TaskExecuted(uint256 indexed taskId, address indexed agent, bool success, int256 profit)",
  "event AgentRegistered(address indexed agent)",
] as const;

export const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function stakedAmount(address) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
] as const;

export const AGENT_TOKEN_ABI = [
  "function currentPrice() view returns (uint256)",
  "function basePrice() view returns (uint256)",
  "function isBelowDeathLine() view returns (bool)",
  "function marketCap() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
] as const;

export const AGENT_FACTORY_ABI = [
  "function agentInfo(address) view returns (address agent, address token, string name, string symbol, uint256 createdAt, bool alive)",
  "function getAgentToken(address) view returns (address)",
  "function isAgentAlive(address) view returns (bool)",
  "function getAgentCount() view returns (uint256)",
  "function allAgents(uint256) view returns (address)",
] as const;
