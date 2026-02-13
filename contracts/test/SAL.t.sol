// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/SALToken.sol";
import "../contracts/AgentFactory.sol";
import "../contracts/SpeculationAgentLeague.sol";

contract SALTest is Test {
    SALToken token;
    AgentFactory factory;
    SpeculationAgentLeague league;

    address owner = address(this);
    address agent1 = makeAddr("agent1");
    address agent2 = makeAddr("agent2");
    address agent3 = makeAddr("agent3");
    address agent4 = makeAddr("agent4");

    function setUp() public {
        token = new SALToken();
        factory = new AgentFactory();
        league = new SpeculationAgentLeague(address(token), address(factory));
        token.transferOwnership(address(league));
        factory.setLeague(address(league));

        uint256 amount = 10000 ether;
        token.transfer(agent1, amount);
        token.transfer(agent2, amount);
        token.transfer(agent3, amount);

        // 为测试 Agent 创建 Agent Token
        factory.createAgent(agent1, "Agent1Token", "AG1");
        factory.createAgent(agent2, "Agent2Token", "AG2");
        factory.createAgent(agent3, "Agent3Token", "AG3");
    }

    // ── Agent Registration ──

    function test_registerAgent() public {
        vm.prank(agent1);
        league.registerAgent();
        SpeculationAgentLeague.AgentStats memory stats = league.getAgentStats(agent1);
        assertTrue(stats.registered);
    }

    function test_rejectDuplicateRegistration() public {
        vm.prank(agent1);
        league.registerAgent();
        vm.prank(agent1);
        vm.expectRevert("Already registered");
        league.registerAgent();
    }

    function test_trackRegisteredAgentCount() public {
        vm.prank(agent1);
        league.registerAgent();
        vm.prank(agent2);
        league.registerAgent();
        assertEq(league.getRegisteredAgentCount(), 2);
    }

    // ── Epoch Management ──

    function test_startEpoch() public {
        league.startEpoch();
        assertEq(league.currentEpochId(), 1);
    }

    function test_create3TasksPerEpoch() public {
        league.startEpoch();
        uint256[] memory taskList = league.getEpochTasks(1);
        assertEq(taskList.length, 3);
    }

    function test_closeEpoch() public {
        league.startEpoch();
        league.closeEpoch();
        (, , , bool closed) = league.epochs(1);
        assertTrue(closed);
    }

    function test_cannotStartBeforeClosing() public {
        league.startEpoch();
        vm.expectRevert("Previous epoch not closed");
        league.startEpoch();
    }

    // ── Task Execution ──

    function test_executeArbitrageSuccess() public {
        vm.prank(agent1);
        league.registerAgent();
        // 使用 startEpochWithData 设定已知市场数据
        int256[3] memory prices = [int256(50), int256(0), int256(0)];
        bool[3] memory liqs = [false, false, false];
        uint256[3] memory ratios = [uint256(60), uint256(0), uint256(0)];
        league.startEpochWithData(prices, liqs, ratios);

        uint256[] memory taskList = league.getEpochTasks(1);
        // Agent 预测 +40，实际 +50，方向正确
        vm.prank(agent1);
        league.executeArbitrage(taskList[0], 40);
        SpeculationAgentLeague.AgentStats memory stats = league.getAgentStats(agent1);
        assertEq(stats.successCount, 1);
        assertTrue(stats.totalProfit > 0);
    }

    function test_executeArbitrageFail() public {
        vm.prank(agent1);
        league.registerAgent();

        int256[3] memory prices = [int256(50), int256(0), int256(0)];
        bool[3] memory liqs = [false, false, false];
        uint256[3] memory ratios = [uint256(60), uint256(0), uint256(0)];
        league.startEpochWithData(prices, liqs, ratios);

        uint256[] memory taskList = league.getEpochTasks(1);
        // Agent 预测 -30，实际 +50，方向错误
        vm.prank(agent1);
        league.executeArbitrage(taskList[0], -30);
        SpeculationAgentLeague.AgentStats memory stats = league.getAgentStats(agent1);
        assertEq(stats.failCount, 1);
        assertEq(stats.totalProfit, 0);
    }

    function test_executeLiquidationCorrect() public {
        vm.prank(agent1);
        league.registerAgent();

        int256[3] memory prices = [int256(0), int256(0), int256(0)];
        bool[3] memory liqs = [true, false, false];
        uint256[3] memory ratios = [uint256(0), uint256(0), uint256(0)];
        league.startEpochWithData(prices, liqs, ratios);

        uint256[] memory taskList = league.getEpochTasks(1);
        // taskIds: [0]=Arb, [1]=Liq(shouldLiquidate=liqs[0]=true), [2]=Rebalance
        // Agent 判断应该清算，实际也应该清算
        vm.prank(agent1);
        league.executeLiquidation(taskList[1], true);
        SpeculationAgentLeague.AgentStats memory stats = league.getAgentStats(agent1);
        assertEq(stats.successCount, 1);
    }

    function test_executeRebalancePrecise() public {
        vm.prank(agent1);
        league.registerAgent();

        int256[3] memory prices = [int256(0), int256(0), int256(0)];
        bool[3] memory liqs = [false, false, false];
        uint256[3] memory ratios = [uint256(65), uint256(0), uint256(0)];
        league.startEpochWithData(prices, liqs, ratios);

        uint256[] memory taskList = league.getEpochTasks(1);
        // taskIds: [0]=Arb, [1]=Liq, [2]=Rebalance
        // optimalRatios[0]=65, Agent 提交 63，偏差 2 <= 5，满额奖励
        vm.prank(agent1);
        league.executeRebalance(taskList[2], 63);
        SpeculationAgentLeague.AgentStats memory stats = league.getAgentStats(agent1);
        assertEq(stats.successCount, 1);
    }

    function test_preventDoubleExecution() public {
        vm.prank(agent1);
        league.registerAgent();
        league.startEpoch();
        uint256[] memory taskList = league.getEpochTasks(1);
        vm.prank(agent1);
        league.executeArbitrage(taskList[0], 0);
        vm.prank(agent1);
        vm.expectRevert("Already executed");
        league.executeArbitrage(taskList[0], 0);
    }

    function test_rejectUnregisteredAgent() public {
        league.startEpoch();
        uint256[] memory taskList = league.getEpochTasks(1);
        vm.prank(agent4);
        vm.expectRevert("Not registered");
        league.executeArbitrage(taskList[0], 0);
    }

    // ── Staking ──

    function test_stakeTokens() public {
        uint256 amount = 1000 ether;
        vm.prank(agent1);
        token.stake(amount);
        assertEq(token.stakedAmount(agent1), amount);
    }

    function test_unstakeTokens() public {
        uint256 amount = 1000 ether;
        vm.prank(agent1);
        token.stake(amount);
        vm.prank(agent1);
        token.unstake(amount);
        assertEq(token.stakedAmount(agent1), 0);
    }

    // ── Leaderboard ──

    function test_returnLeaderboard() public {
        vm.prank(agent1);
        league.registerAgent();
        vm.prank(agent2);
        league.registerAgent();
        (address[] memory addrs, ) = league.getLeaderboard(5);
        assertEq(addrs.length, 2);
    }

    // ── Score differentiates agents ──

    function test_differentAgentsGetDifferentScores() public {
        vm.prank(agent1);
        league.registerAgent();
        vm.prank(agent1);
        token.stake(5000 ether);

        vm.prank(agent2);
        league.registerAgent();
        vm.prank(agent2);
        token.stake(1000 ether);

        // Epoch with known data: price +50, should liquidate, optimal ratio 60
        int256[3] memory prices = [int256(50), int256(0), int256(0)];
        bool[3] memory liqs = [false, true, false];
        uint256[3] memory ratios = [uint256(0), uint256(0), uint256(60)];
        league.startEpochWithData(prices, liqs, ratios);
        uint256[] memory taskList = league.getEpochTasks(1);

        // Agent1: 正确预测方向
        vm.prank(agent1);
        league.executeArbitrage(taskList[0], 45);
        // Agent2: 错误预测方向
        vm.prank(agent2);
        league.executeArbitrage(taskList[0], -20);

        uint256 score1 = league.getAgentScore(agent1);
        uint256 score2 = league.getAgentScore(agent2);
        assertTrue(score1 > score2, "Agent1 should have higher score");
    }
}
