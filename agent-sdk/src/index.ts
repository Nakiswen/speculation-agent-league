/**
 * SAL Agent SDK
 * 提供 Agent 注册、任务获取、任务执行等核心功能
 */
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const LEAGUE_ABI = [
  "function registerAgent() external",
  "function currentEpochId() view returns (uint256)",
  "function epochDuration() view returns (uint256)",
  "function epochs(uint256) view returns (uint256 id, uint256 startTime, uint256 endTime, bool closed)",
  "function getEpochTasks(uint256) view returns (uint256[])",
  "function tasks(uint256) view returns (uint256 taskId, uint256 epochId, uint8 taskType, uint256 reward, uint256 createdAt, bool resolved, address winner, int256 targetPrice, uint256 threshold)",
  "function executeArbitrage(uint256 taskId, int256 direction) external",
  "function executeLiquidation(uint256 taskId) external",
  "function executeRebalance(uint256 taskId, uint256 proposedRatio) external",
  "function getAgentStats(address) view returns (tuple(bool registered, int256 totalProfit, uint256 successCount, uint256 failCount, uint256 totalResponseTime, uint256 activeStake, uint256 lastExecutionEpoch))",
  "function getAgentScore(address) view returns (uint256)",
  "function taskExecutions(uint256, address) view returns (bool)",
] as const;

export enum TaskType {
  Arbitrage = 0,
  Liquidation = 1,
  Rebalance = 2,
}

export interface TaskInfo {
  taskId: bigint;
  epochId: bigint;
  taskType: TaskType;
  reward: bigint;
  createdAt: bigint;
  resolved: boolean;
  winner: string;
  targetPrice: bigint;
  threshold: bigint;
}

export interface AgentStats {
  registered: boolean;
  totalProfit: bigint;
  successCount: bigint;
  failCount: bigint;
  totalResponseTime: bigint;
  activeStake: bigint;
  lastExecutionEpoch: bigint;
}

export interface SALAgentConfig {
  rpcUrl: string;
  privateKey: string;
  leagueAddress: string;
}

export class SALAgent {
  private wallet: ethers.Wallet;
  private league: ethers.Contract;
  readonly address: string;

  constructor(config: SALAgentConfig) {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, provider);
    this.league = new ethers.Contract(config.leagueAddress, LEAGUE_ABI, this.wallet);
    this.address = this.wallet.address;
  }

  /** 注册为 Agent */
  async registerAgent(): Promise<ethers.TransactionReceipt> {
    const tx = await this.league.registerAgent();
    const receipt = await tx.wait();
    if (!receipt) throw new Error("注册交易回执为空");
    return receipt;
  }

  /** 获取当前 Epoch ID */
  async getCurrentEpochId(): Promise<bigint> {
    return this.league.currentEpochId() as Promise<bigint>;
  }

  /** 获取当前 Epoch 的所有任务 */
  async fetchActiveTasks(): Promise<TaskInfo[]> {
    const epochId = await this.getCurrentEpochId();
    if (epochId === 0n) return [];

    const taskIds = (await this.league.getEpochTasks(epochId)) as bigint[];
    const tasks: TaskInfo[] = [];

    for (const id of taskIds) {
      const t = await this.league.tasks(id);
      tasks.push({
        taskId: t[0] as bigint,
        epochId: t[1] as bigint,
        taskType: Number(t[2]) as TaskType,
        reward: t[3] as bigint,
        createdAt: t[4] as bigint,
        resolved: t[5] as boolean,
        winner: t[6] as string,
        targetPrice: t[7] as bigint,
        threshold: t[8] as bigint,
      });
    }

    return tasks;
  }

  /** 检查是否已执行某任务 */
  async hasExecuted(taskId: bigint): Promise<boolean> {
    return this.league.taskExecutions(taskId, this.address) as Promise<boolean>;
  }

  /** 获取自身统计 */
  async getStats(): Promise<AgentStats> {
    const s = await this.league.getAgentStats(this.address);
    return {
      registered: s[0] as boolean,
      totalProfit: s[1] as bigint,
      successCount: s[2] as bigint,
      failCount: s[3] as bigint,
      totalResponseTime: s[4] as bigint,
      activeStake: s[5] as bigint,
      lastExecutionEpoch: s[6] as bigint,
    };
  }

  /** 执行任务（根据类型自动选择策略） */
  async executeTask(
    task: TaskInfo,
    strategy: TaskStrategy
  ): Promise<ethers.TransactionReceipt> {
    const already = await this.hasExecuted(task.taskId);
    if (already) throw new Error(`任务 #${task.taskId} 已执行`);

    let tx: ethers.ContractTransactionResponse;

    switch (task.taskType) {
      case TaskType.Arbitrage: {
        const direction = strategy.decideArbitrage(task);
        tx = await this.league.executeArbitrage(task.taskId, direction);
        break;
      }
      case TaskType.Liquidation: {
        tx = await this.league.executeLiquidation(task.taskId);
        break;
      }
      case TaskType.Rebalance: {
        const ratio = strategy.decideRebalance(task);
        tx = await this.league.executeRebalance(task.taskId, ratio);
        break;
      }
      default:
        throw new Error(`未知任务类型: ${task.taskType}`);
    }

    const receipt = await tx.wait();
    if (!receipt) throw new Error("执行交易回执为空");
    return receipt;
  }
}

/** 策略接口 */
export interface TaskStrategy {
  name: string;
  decideArbitrage(task: TaskInfo): bigint;
  decideRebalance(task: TaskInfo): bigint;
}

/** 内置策略：MomentumBot — 追涨杀跌 */
export const MomentumStrategy: TaskStrategy = {
  name: "MomentumBot",
  decideArbitrage(task) {
    // 追随 targetPrice 方向
    return task.targetPrice;
  },
  decideRebalance(task) {
    // 激进偏移
    return task.threshold + 5n;
  },
};

/** 内置策略：MeanRevertBot — 均值回归 */
export const MeanRevertStrategy: TaskStrategy = {
  name: "MeanRevertBot",
  decideArbitrage(task) {
    // 反向操作
    return -task.targetPrice;
  },
  decideRebalance(task) {
    // 精确匹配
    return task.threshold;
  },
};

/** 内置策略：RandomBot — 随机 */
export const RandomStrategy: TaskStrategy = {
  name: "RandomBot",
  decideArbitrage(_task) {
    return BigInt(Math.floor(Math.random() * 200) - 100);
  },
  decideRebalance(_task) {
    return BigInt(Math.floor(Math.random() * 100));
  },
};

/** 内置策略：ConservativeBot — 保守 */
export const ConservativeStrategy: TaskStrategy = {
  name: "ConservativeBot",
  decideArbitrage(task) {
    // 只在 targetPrice 绝对值大时才跟随
    return task.targetPrice > 50n || task.targetPrice < -50n ? task.targetPrice : 0n;
  },
  decideRebalance(task) {
    return task.threshold;
  },
};

/** 内置策略：AggroBot — 高频激进 */
export const AggroStrategy: TaskStrategy = {
  name: "AggroBot",
  decideArbitrage(task) {
    // 总是跟随
    return task.targetPrice;
  },
  decideRebalance(task) {
    // 大幅偏移
    return task.threshold + 15n;
  },
};
