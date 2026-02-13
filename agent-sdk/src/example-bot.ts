/**
 * 示例 Agent Bot
 * 每 5 秒轮询，自动执行可盈利任务
 */
import dotenv from "dotenv";
import {
  SALAgent,
  MomentumStrategy,
  MeanRevertStrategy,
  RandomStrategy,
  ConservativeStrategy,
  AggroStrategy,
  type TaskStrategy,
  type SALAgentConfig,
} from "./index.js";

dotenv.config();

function log(name: string, msg: string) {
  console.log(`[${new Date().toISOString()}] [${name}] ${msg}`);
}

const STRATEGIES: TaskStrategy[] = [
  MomentumStrategy,
  MeanRevertStrategy,
  RandomStrategy,
  ConservativeStrategy,
  AggroStrategy,
];

async function runBot(config: SALAgentConfig, strategy: TaskStrategy) {
  const agent = new SALAgent(config);
  log(strategy.name, `地址: ${agent.address}`);

  // 注册
  try {
    const stats = await agent.getStats();
    if (!stats.registered) {
      await agent.registerAgent();
      log(strategy.name, "注册成功");
    } else {
      log(strategy.name, "已注册");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log(strategy.name, `注册检查失败: ${msg}`);
  }

  // 轮询执行
  const poll = async () => {
    try {
      const tasks = await agent.fetchActiveTasks();
      for (const task of tasks) {
        if (task.resolved) continue;
        const executed = await agent.hasExecuted(task.taskId);
        if (executed) continue;

        log(strategy.name, `执行任务 #${task.taskId} (类型: ${task.taskType})`);
        try {
          const receipt = await agent.executeTask(task, strategy);
          log(strategy.name, `任务 #${task.taskId} 完成, gas: ${receipt.gasUsed.toString()}`);
        } catch (execErr: unknown) {
          const msg = execErr instanceof Error ? execErr.message : String(execErr);
          log(strategy.name, `任务 #${task.taskId} 执行失败: ${msg}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(strategy.name, `轮询失败: ${msg}`);
    }
  };

  // 立即执行一次，然后每 5 秒轮询
  await poll();
  setInterval(poll, 5000);
}

async function main() {
  const rpcUrl = process.env.MONAD_RPC_URL;
  const leagueAddress = process.env.LEAGUE_ADDRESS;

  if (!rpcUrl || !leagueAddress) {
    console.error("缺少环境变量: MONAD_RPC_URL, LEAGUE_ADDRESS");
    process.exit(1);
  }

  // 从环境变量读取多个 Agent 私钥
  // AGENT_KEY_0, AGENT_KEY_1, ... AGENT_KEY_4
  for (let i = 0; i < STRATEGIES.length; i++) {
    const key = process.env[`AGENT_KEY_${i}`];
    if (!key) {
      log(STRATEGIES[i].name, `跳过 — 未配置 AGENT_KEY_${i}`);
      continue;
    }
    const config: SALAgentConfig = { rpcUrl, privateKey: key, leagueAddress };
    runBot(config, STRATEGIES[i]).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      log(STRATEGIES[i].name, `启动失败: ${msg}`);
    });
  }
}

main().catch(console.error);
