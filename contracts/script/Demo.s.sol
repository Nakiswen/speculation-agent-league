// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/SALToken.sol";
import "../contracts/AgentFactory.sol";
import "../contracts/SpeculationAgentLeague.sol";

/**
 * @title DemoScript
 * @notice 演示脚本 — 5 个 Agent 使用不同策略执行 10 个 Epoch
 *
 * Agent 策略：
 *   0 MomentumBot   — 精确跟随市场（高胜率）
 *   1 MeanRevertBot — 反向操作（低胜率 arb，高胜率 liq）
 *   2 RandomBot     — 随机值（~50% 胜率）
 *   3 ConservBot    — 保守策略，只在大波动时参与
 *   4 AggroBot      — 激进策略，高 stake 但偏差大
 */
contract DemoScript is Script {
    function run() external {
        uint256 ownerKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        uint256[5] memory agentKeys = [
            uint256(0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d),
            uint256(0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a),
            uint256(0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6),
            uint256(0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a),
            uint256(0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba)
        ];
        address[5] memory agents = [
            vm.addr(agentKeys[0]),
            vm.addr(agentKeys[1]),
            vm.addr(agentKeys[2]),
            vm.addr(agentKeys[3]),
            vm.addr(agentKeys[4])
        ];

        address tokenAddr = vm.envAddress("SAL_TOKEN_ADDRESS");
        address leagueAddr = vm.envAddress("LEAGUE_ADDRESS");
        address factoryAddr = vm.envAddress("FACTORY_ADDRESS");
        SALToken token = SALToken(tokenAddr);
        SpeculationAgentLeague league = SpeculationAgentLeague(leagueAddr);
        AgentFactory factory = AgentFactory(payable(factoryAddr));

        // ── 1. 分发 Token ──
        console.log("=== Distribute Tokens ===");
        vm.startBroadcast(ownerKey);
        for (uint256 i = 0; i < 5; i++) {
            token.transfer(agents[i], 100_000 ether);
        }
        vm.stopBroadcast();

        // ── 1.5 创建 Agent Token ──
        console.log("=== Create Agent Tokens ===");
        string[5] memory tokenNames = ["ArbKing Token", "LiquidBot Token", "RebalanceAI Token", "SteadyHand Token", "FullSend Token"];
        string[5] memory tokenSymbols = ["ARBK", "LIQB", "RBAL", "STDY", "FSND"];
        vm.startBroadcast(ownerKey);
        for (uint256 i = 0; i < 5; i++) {
            factory.createAgent(agents[i], tokenNames[i], tokenSymbols[i]);
            console.log("Created token for agent:", agents[i]);
        }
        vm.stopBroadcast();

        // ── 2. 注册 Agent ──
        console.log("=== Register Agents ===");
        for (uint256 i = 0; i < 5; i++) {
            vm.broadcast(agentKeys[i]);
            league.registerAgent();
        }

        // ── 3. 差异化 Staking ──
        console.log("=== Staking ===");
        uint256[5] memory stakes = [
            uint256(50_000 ether),  // MomentumBot  - 中高
            uint256(30_000 ether),  // MeanRevertBot - 中
            uint256(10_000 ether),  // RandomBot    - 低
            uint256(5_000 ether),   // ConservBot   - 最低
            uint256(80_000 ether)   // AggroBot     - 最高
        ];
        for (uint256 i = 0; i < 5; i++) {
            vm.broadcast(agentKeys[i]);
            token.stake(stakes[i]);
        }

        // ── 4. 运行 10 个 Epoch ──
        // 预设市场数据：模拟真实波动
        int256[10] memory priceMoves  = [int256(42), -35, 78, -12, 55, -68, 23, 91, -45, 30];
        bool[10]   memory liqFlags    = [true, false, true, true, false, true, false, false, true, false];
        uint256[10] memory optRatios  = [uint256(60), 45, 72, 38, 55, 80, 50, 65, 42, 58];

        for (uint256 epoch = 0; epoch < 10; epoch++) {
            console.log("--- Epoch", epoch + 1, "---");

            // 构造 startEpochWithData 参数
            int256[3] memory prices = [priceMoves[epoch], int256(0), int256(0)];
            bool[3]   memory liqs   = [false, liqFlags[epoch], false];
            uint256[3] memory ratios = [uint256(0), uint256(0), optRatios[epoch]];

            vm.broadcast(ownerKey);
            league.startEpochWithData(prices, liqs, ratios);

            uint256[] memory taskIds = league.getEpochTasks(epoch + 1);
            // taskIds[0] = Arbitrage, taskIds[1] = Liquidation, taskIds[2] = Rebalance

            // ── 每个 Agent 执行三种任务 ──
            for (uint256 i = 0; i < 5; i++) {
                // --- Arbitrage ---
                int256 predicted;
                if (i == 0) {
                    // MomentumBot: 精确跟随（偏差 ±3）
                    predicted = priceMoves[epoch] + 3;
                } else if (i == 1) {
                    // MeanRevertBot: 反向操作
                    predicted = -priceMoves[epoch];
                } else if (i == 2) {
                    // RandomBot: 伪随机
                    predicted = int256(uint256(keccak256(abi.encodePacked(epoch, i))) % 160) - 80;
                } else if (i == 3) {
                    // ConservBot: 只在大波动时跟随，否则不参与（预测 0）
                    predicted = priceMoves[epoch] > 40 || priceMoves[epoch] < -40
                        ? priceMoves[epoch] - 5
                        : int256(0);
                } else {
                    // AggroBot: 方向正确但偏差大
                    predicted = priceMoves[epoch] > 0 ? priceMoves[epoch] + 50 : priceMoves[epoch] - 50;
                }
                vm.broadcast(agentKeys[i]);
                league.executeArbitrage(taskIds[0], predicted);

                // --- Liquidation ---
                bool liqDecision;
                if (i == 0) {
                    // MomentumBot: 跟随市场（80% 正确率模拟：偶数 epoch 正确）
                    liqDecision = epoch % 5 != 3 ? liqFlags[epoch] : !liqFlags[epoch];
                } else if (i == 1) {
                    // MeanRevertBot: 总是反向判断
                    liqDecision = !liqFlags[epoch];
                } else if (i == 2) {
                    // RandomBot: 伪随机
                    liqDecision = uint256(keccak256(abi.encodePacked(epoch, i, "liq"))) % 2 == 0;
                } else if (i == 3) {
                    // ConservBot: 总是判断不清算（保守）
                    liqDecision = false;
                } else {
                    // AggroBot: 总是判断清算（激进）
                    liqDecision = true;
                }
                vm.broadcast(agentKeys[i]);
                league.executeLiquidation(taskIds[1], liqDecision);

                // --- Rebalance ---
                uint256 proposed;
                if (i == 0) {
                    // MomentumBot: 接近最优（偏差 2）
                    proposed = optRatios[epoch] > 2 ? optRatios[epoch] - 2 : 0;
                } else if (i == 1) {
                    // MeanRevertBot: 偏差中等（偏差 10）
                    proposed = optRatios[epoch] > 10 ? optRatios[epoch] - 10 : 0;
                } else if (i == 2) {
                    // RandomBot: 伪随机
                    proposed = uint256(keccak256(abi.encodePacked(epoch, i, "reb"))) % 100;
                } else if (i == 3) {
                    // ConservBot: 总是提交 50（中间值）
                    proposed = 50;
                } else {
                    // AggroBot: 偏差很大（偏差 25）
                    proposed = optRatios[epoch] + 25 > 100 ? 100 : optRatios[epoch] + 25;
                }
                vm.broadcast(agentKeys[i]);
                league.executeRebalance(taskIds[2], proposed);
            }

            vm.broadcast(ownerKey);
            league.closeEpoch();
        }

        // ── 5. 输出排行榜 ──
        console.log("=== Final Leaderboard ===");
        (address[] memory addrs, uint256[] memory scores) = league.getLeaderboard(5);
        for (uint256 i = 0; i < addrs.length; i++) {
            console.log("Rank", i + 1);
            console.log("  Address:", addrs[i]);
            console.log("  Score:", scores[i]);
        }

        // ── 6. 输出每个 Agent 详细统计 ──
        console.log("=== Agent Details ===");
        string[5] memory names = ["MomentumBot", "MeanRevertBot", "RandomBot", "ConservBot", "AggroBot"];
        for (uint256 i = 0; i < 5; i++) {
            SpeculationAgentLeague.AgentStats memory s = league.getAgentStats(agents[i]);
            console.log(names[i]);
            console.log("  Success:", s.successCount);
            console.log("  Fail:", s.failCount);
            console.log("  TotalProfit:", s.totalProfit);
            console.log("  PeakProfit:", s.peakProfit);
            console.log("  WorstDrawdown:", s.worstDrawdown);
            console.log("  ConsecLosses:", s.consecutiveLosses);
        }

        console.log("=== Demo Complete ===");
    }
}
