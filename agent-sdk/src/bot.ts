import * as dotenv from "dotenv";
dotenv.config();

import { SALClient } from "./index";
import { Strategy, ALL_STRATEGIES } from "./strategies";

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || "5000", 10);

interface BotInstance {
  client: SALClient;
  strategy: Strategy;
}

/**
 * 示例 Bot — 每 5 秒轮询，自动执行可盈利任务
 * 支持多 Agent 实例运行
 */
async function main() {
  const privateKeys = (process.env.PRIVATE_KEY || "").split(",").filter(Boolean);
  if (privateKeys.length === 0) {
    console.error("请在 .env 中设置 PRIVATE_KEY（多个用逗号分隔）");
    process.exit(1);
  }

  const bots: BotInstance[] = privateKeys.map((key, i) => {
    const strategy = ALL_STRATEGIES[i % ALL_STRATEGIES.length];
    const client = new SALClient({
      rpcUrl: process.env.RPC_URL || "https://testnet.monad.xyz",
      privateKey: key.trim(),
      leagueAddress: process.env.LEAGUE_ADDRESS || "",
      tokenAddress: process.env.TOKEN_ADDRESS || "",
    });
    return { client, strategy };
  });

  // 注册所有 Agent
  for (const bot of bots) {
    try {
      const stats = await bot.client.getStats();
      if (!stats.registered) {
        console.log(`[${bot.strategy.name}] 注册中...`);
        await bot.client.registerAgent();
        console.log(`[${bot.strategy.name}] 注册成功: ${bot.client.address}`);
      } else {
        console.log(`[${bot.strategy.name}] 已注册: ${bot.client.address}`);
      }
    } catch (err) {
      console.error(`[${bot.strategy.name}] 注册失败:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n启动 ${bots.length} 个 Bot，轮询间隔 ${POLL_INTERVAL}ms\n`);

  // 轮询执行
  setInterval(async () => {
    for (const bot of bots) {
      try {
        const tasks = await bot.client.fetchActiveTasks();
        if (tasks.length === 0) continue;

        for (const task of tasks) {
          const executed = await bot.client.hasExecuted(task.taskId);
          if (executed) continue;

          const decision = bot.strategy.decide(task);
          if (!decision.shouldExecute) continue;

          console.log(`[${bot.strategy.name}] 执行任务 #${task.taskId} (类型: ${task.taskType})`);
          const receipt = await bot.client.executeTask(task, {
            direction: decision.direction,
            proposedRatio: decision.proposedRatio,
          });
          console.log(`[${bot.strategy.name}] 完成, gas: ${receipt?.gasUsed}`);
        }
      } catch (err) {
        console.error(`[${bot.strategy.name}] 错误:`, err instanceof Error ? err.message : err);
      }
    }
  }, POLL_INTERVAL);
}

main().catch(console.error);
