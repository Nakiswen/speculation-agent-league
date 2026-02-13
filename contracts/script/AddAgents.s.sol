// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/SALToken.sol";
import "../contracts/AgentFactory.sol";
import "../contracts/SpeculationAgentLeague.sol";

/**
 * @title AddAgentsScript
 * @notice 追加 10 个 Agent 并跑 5 个 Epoch，让 Leaderboard 更丰富
 */
contract AddAgentsScript is Script {
    function run() external {
        uint256 ownerKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        // Anvil 默认账户 #6 ~ #15
        uint256[10] memory newKeys = [
            uint256(0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97),
            uint256(0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6),
            uint256(0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897),
            uint256(0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82),
            uint256(0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1),
            uint256(0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd),
            uint256(0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa),
            uint256(0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61),
            uint256(0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0),
            uint256(0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd)
        ];

        address[10] memory newAgents;
        for (uint256 i = 0; i < 10; i++) {
            newAgents[i] = vm.addr(newKeys[i]);
        }

        address tokenAddr = vm.envAddress("SAL_TOKEN_ADDRESS");
        address leagueAddr = vm.envAddress("LEAGUE_ADDRESS");
        address factoryAddr = vm.envAddress("FACTORY_ADDRESS");
        SALToken token = SALToken(tokenAddr);
        SpeculationAgentLeague league = SpeculationAgentLeague(leagueAddr);
        AgentFactory factory = AgentFactory(payable(factoryAddr));

        // ── 1. 分发 Token ──
        console.log("=== Distribute Tokens to 10 new Agents ===");
        vm.startBroadcast(ownerKey);
        for (uint256 i = 0; i < 10; i++) {
            token.transfer(newAgents[i], 50_000 ether);
        }
        vm.stopBroadcast();

        // ── 2. 创建 Agent Token + 注册 ──
        string[10] memory names = [
            "AlphaSeeker Token", "GridMaster Token", "ScalpBot Token",
            "SwingKing Token", "DeltaHedge Token", "FlowTrader Token",
            "QuantPulse Token", "NeuralEdge Token", "VortexAI Token", "ZenTrader Token"
        ];
        string[10] memory symbols = [
            "ALPH", "GRID", "SCLP", "SWNG", "DLTA",
            "FLOW", "QPLS", "NRAL", "VRTX", "ZENT"
        ];

        console.log("=== Create Agent Tokens ===");
        vm.startBroadcast(ownerKey);
        for (uint256 i = 0; i < 10; i++) {
            factory.createAgent(newAgents[i], names[i], symbols[i]);
        }
        vm.stopBroadcast();

        console.log("=== Register Agents ===");
        for (uint256 i = 0; i < 10; i++) {
            vm.broadcast(newKeys[i]);
            league.registerAgent();
        }

        // ── 3. Staking ──
        console.log("=== Staking ===");
        uint256[10] memory stakes = [
            uint256(40_000 ether), uint256(25_000 ether), uint256(35_000 ether),
            uint256(20_000 ether), uint256(45_000 ether), uint256(15_000 ether),
            uint256(30_000 ether), uint256(22_000 ether), uint256(38_000 ether),
            uint256(18_000 ether)
        ];
        for (uint256 i = 0; i < 10; i++) {
            vm.broadcast(newKeys[i]);
            token.stake(stakes[i]);
        }

        // ── 4. 运行 5 个 Epoch ──
        int256[5] memory priceMoves = [int256(55), -28, 67, -42, 38];
        bool[5] memory liqFlags = [false, true, false, true, true];
        uint256[5] memory optRatios = [uint256(55), 70, 40, 62, 48];

        uint256 currentEpoch = league.currentEpochId();
        // 获取所有 15 个 agent 地址
        uint256 totalAgents = league.getRegisteredAgentCount();
        console.log("Total agents:", totalAgents);

        for (uint256 epoch = 0; epoch < 5; epoch++) {
            console.log("--- Extra Epoch", epoch + 1, "---");

            int256[3] memory prices = [priceMoves[epoch], int256(0), int256(0)];
            bool[3] memory liqs = [false, liqFlags[epoch], false];
            uint256[3] memory ratios = [uint256(0), uint256(0), optRatios[epoch]];

            vm.broadcast(ownerKey);
            league.startEpochWithData(prices, liqs, ratios);

            uint256 epId = league.currentEpochId();
            uint256[] memory taskIds = league.getEpochTasks(epId);

            // 新 Agent 执行任务（各有不同策略风格）
            for (uint256 i = 0; i < 10; i++) {
                // Arbitrage
                int256 predicted;
                if (i < 3) {
                    // 前 3 个：较准确
                    predicted = priceMoves[epoch] + int256(i) * 2 - 2;
                } else if (i < 6) {
                    // 中间 3 个：中等偏差
                    predicted = priceMoves[epoch] + int256(i) * 5 - 20;
                } else {
                    // 后 4 个：偏差较大
                    predicted = int256(uint256(keccak256(abi.encodePacked(epoch, i))) % 120) - 60;
                }
                vm.broadcast(newKeys[i]);
                league.executeArbitrage(taskIds[0], predicted);

                // Liquidation
                bool liqDec;
                if (i % 3 == 0) liqDec = liqFlags[epoch];
                else if (i % 3 == 1) liqDec = !liqFlags[epoch];
                else liqDec = uint256(keccak256(abi.encodePacked(epoch, i, "l"))) % 2 == 0;
                vm.broadcast(newKeys[i]);
                league.executeLiquidation(taskIds[1], liqDec);

                // Rebalance
                uint256 proposed;
                if (i < 4) proposed = optRatios[epoch] > 5 ? optRatios[epoch] - uint256(i) * 2 : 0;
                else proposed = uint256(keccak256(abi.encodePacked(epoch, i, "r"))) % 100;
                vm.broadcast(newKeys[i]);
                league.executeRebalance(taskIds[2], proposed);
            }

            // 原来的 5 个 agent 也继续执行
            uint256[5] memory origKeys = [
                uint256(0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d),
                uint256(0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a),
                uint256(0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6),
                uint256(0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a),
                uint256(0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba)
            ];
            for (uint256 i = 0; i < 5; i++) {
                int256 p2;
                if (i == 0) p2 = priceMoves[epoch] + 3;
                else if (i == 1) p2 = -priceMoves[epoch];
                else if (i == 2) p2 = int256(uint256(keccak256(abi.encodePacked(epoch, i, "x"))) % 160) - 80;
                else if (i == 3) p2 = priceMoves[epoch] > 40 || priceMoves[epoch] < -40 ? priceMoves[epoch] - 5 : int256(0);
                else p2 = priceMoves[epoch] > 0 ? priceMoves[epoch] + 50 : priceMoves[epoch] - 50;
                vm.broadcast(origKeys[i]);
                league.executeArbitrage(taskIds[0], p2);

                bool ld;
                if (i == 0) ld = epoch % 3 != 2 ? liqFlags[epoch] : !liqFlags[epoch];
                else if (i == 1) ld = !liqFlags[epoch];
                else if (i == 3) ld = false;
                else if (i == 4) ld = true;
                else ld = uint256(keccak256(abi.encodePacked(epoch, i, "ld"))) % 2 == 0;
                vm.broadcast(origKeys[i]);
                league.executeLiquidation(taskIds[1], ld);

                uint256 rb;
                if (i == 0) rb = optRatios[epoch] > 2 ? optRatios[epoch] - 2 : 0;
                else if (i == 1) rb = optRatios[epoch] > 10 ? optRatios[epoch] - 10 : 0;
                else if (i == 3) rb = 50;
                else if (i == 4) rb = optRatios[epoch] + 25 > 100 ? 100 : optRatios[epoch] + 25;
                else rb = uint256(keccak256(abi.encodePacked(epoch, i, "rb"))) % 100;
                vm.broadcast(origKeys[i]);
                league.executeRebalance(taskIds[2], rb);
            }

            vm.broadcast(ownerKey);
            league.closeEpoch();
        }

        console.log("=== Done: 10 new agents + 5 extra epochs ===");
    }
}
