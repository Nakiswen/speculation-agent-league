/**
 * 本地演示脚本
 * 模拟完整流程：注册 Agent → Stake → 开启 Epoch → 执行任务 → 查看排行榜
 */
import { ethers } from "hardhat";

async function main() {
  const [owner, agent1, agent2, agent3, agent4, agent5] = await ethers.getSigners();

  // 连接已部署的合约
  const tokenAddr = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
  const leagueAddr = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";

  const token = await ethers.getContractAt("SALToken", tokenAddr);
  const league = await ethers.getContractAt("SpeculationAgentLeague", leagueAddr);

  const agents = [
    { signer: agent1, name: "MomentumBot" },
    { signer: agent2, name: "MeanRevertBot" },
    { signer: agent3, name: "RandomBot" },
    { signer: agent4, name: "ConservativeBot" },
    { signer: agent5, name: "AggroBot" },
  ];

  console.log("\n=== 1. 分发 SAL Token ===");
  const distributeAmount = ethers.parseEther("100000");
  for (const a of agents) {
    await token.connect(owner).transfer(a.signer.address, distributeAmount);
    console.log(`  ${a.name} (${a.signer.address}): ${ethers.formatEther(distributeAmount)} SAL`);
  }

  console.log("\n=== 2. Agent 注册 ===");
  for (const a of agents) {
    await league.connect(a.signer).registerAgent();
    console.log(`  ${a.name} 注册成功`);
  }

  console.log("\n=== 3. Staking ===");
  const stakeAmounts = [
    ethers.parseEther("50000"), // MomentumBot
    ethers.parseEther("30000"), // MeanRevertBot
    ethers.parseEther("10000"), // RandomBot
    ethers.parseEther("5000"),  // ConservativeBot
    ethers.parseEther("80000"), // AggroBot
  ];
  for (let i = 0; i < agents.length; i++) {
    await token.connect(agents[i].signer).stake(stakeAmounts[i]);
    console.log(`  ${agents[i].name} 质押 ${ethers.formatEther(stakeAmounts[i])} SAL`);
  }

  // 运行 2 个 Epoch
  for (let epoch = 1; epoch <= 2; epoch++) {
    console.log(`\n=== 4.${epoch} 开启 Epoch #${epoch} ===`);
    await league.connect(owner).startEpoch();
    const epochId = await league.currentEpochId();
    console.log(`  Epoch #${epochId} 已开启`);

    const taskIds = await league.getEpochTasks(epochId);
    console.log(`  生成 ${taskIds.length} 个任务: [${taskIds.join(", ")}]`);

    console.log(`\n=== 5.${epoch} Agent 执行任务 ===`);
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      for (const taskId of taskIds) {
        const task = await league.tasks(taskId);
        const taskType = Number(task.taskType);
        try {
          if (taskType === 0) {
            // Arbitrage — 不同策略给不同 direction
            const directions = [task.targetPrice, -task.targetPrice, BigInt(Math.floor(Math.random() * 200) - 100), 0n, task.targetPrice];
            await league.connect(a.signer).executeArbitrage(taskId, directions[i]);
          } else if (taskType === 1) {
            await league.connect(a.signer).executeLiquidation(taskId);
          } else {
            const ratios = [task.threshold + 5n, task.threshold, BigInt(Math.floor(Math.random() * 100)), task.threshold, task.threshold + 15n];
            await league.connect(a.signer).executeRebalance(taskId, ratios[i]);
          }
          console.log(`  ✅ ${a.name} 执行任务 #${taskId} (类型: ${["Arbitrage", "Liquidation", "Rebalance"][taskType]})`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          // 忽略频率限制错误
          if (msg.includes("Max frequency")) {
            console.log(`  ⏭️  ${a.name} 跳过任务 #${taskId} (达到频率上限)`);
          } else {
            console.log(`  ❌ ${a.name} 任务 #${taskId} 失败: ${msg.slice(0, 80)}`);
          }
        }
      }
    }

    console.log(`\n=== 6.${epoch} 关闭 Epoch #${epoch} ===`);
    await league.connect(owner).closeEpoch();
    console.log(`  Epoch #${epochId} 已关闭`);
  }

  console.log("\n=== 7. 排行榜 ===");
  const [addrs, scores] = await league.getLeaderboard(5);
  console.log("  排名 | Agent                                      | 分数");
  console.log("  -----|--------------------------------------------|---------");
  for (let i = 0; i < addrs.length; i++) {
    const name = agents.find(a => a.signer.address === addrs[i])?.name ?? "Unknown";
    console.log(`  #${i + 1}   | ${name.padEnd(15)} (${addrs[i]}) | ${scores[i].toString()}`);
  }

  console.log("\n=== 8. Agent 详细统计 ===");
  for (const a of agents) {
    const stats = await league.getAgentStats(a.signer.address);
    const score = await league.getAgentScore(a.signer.address);
    console.log(`  ${a.name}:`);
    console.log(`    总盈亏: ${ethers.formatEther(stats.totalProfit)} SAL`);
    console.log(`    成功: ${stats.successCount}, 失败: ${stats.failCount}`);
    console.log(`    评分: ${score.toString()}`);
  }

  console.log("\n✅ 本地演示完成");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
