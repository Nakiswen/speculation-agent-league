import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Speculation Agent League", function () {
  async function deployFixture() {
    const [owner, agent1, agent2, agent3, agent4] = await ethers.getSigners();

    const SALToken = await ethers.getContractFactory("SALToken");
    const token = await SALToken.deploy();
    await token.waitForDeployment();

    const League = await ethers.getContractFactory("SpeculationAgentLeague");
    const league = await League.deploy(await token.getAddress());
    await league.waitForDeployment();

    // Transfer token ownership to league for mint/slash
    await token.transferOwnership(await league.getAddress());

    // Give agents some tokens for staking
    const amount = ethers.parseEther("10000");
    for (const agent of [agent1, agent2, agent3]) {
      await token.transfer(agent.address, amount);
    }

    return { token, league, owner, agent1, agent2, agent3, agent4 };
  }

  describe("Agent Registration", function () {
    it("should register an agent", async function () {
      const { league, agent1 } = await loadFixture(deployFixture);
      await league.connect(agent1).registerAgent();
      const stats = await league.getAgentStats(agent1.address);
      expect(stats.registered).to.be.true;
    });

    it("should reject duplicate registration", async function () {
      const { league, agent1 } = await loadFixture(deployFixture);
      await league.connect(agent1).registerAgent();
      await expect(league.connect(agent1).registerAgent()).to.be.revertedWith("Already registered");
    });

    it("should track registered agent count", async function () {
      const { league, agent1, agent2 } = await loadFixture(deployFixture);
      await league.connect(agent1).registerAgent();
      await league.connect(agent2).registerAgent();
      expect(await league.getRegisteredAgentCount()).to.equal(2);
    });
  });

  describe("Epoch Management", function () {
    it("should start an epoch", async function () {
      const { league } = await loadFixture(deployFixture);
      await league.startEpoch();
      expect(await league.currentEpochId()).to.equal(1);
    });

    it("should create 3 tasks per epoch", async function () {
      const { league } = await loadFixture(deployFixture);
      await league.startEpoch();
      const tasks = await league.getEpochTasks(1);
      expect(tasks.length).to.equal(3);
    });

    it("should close an epoch", async function () {
      const { league } = await loadFixture(deployFixture);
      await league.startEpoch();
      await league.closeEpoch();
      const epoch = await league.epochs(1);
      expect(epoch.closed).to.be.true;
    });

    it("should not start new epoch before closing previous", async function () {
      const { league } = await loadFixture(deployFixture);
      await league.startEpoch();
      await expect(league.startEpoch()).to.be.revertedWith("Previous epoch not closed");
    });
  });

  describe("Task Execution", function () {
    it("should execute arbitrage task", async function () {
      const { league, agent1 } = await loadFixture(deployFixture);
      await league.connect(agent1).registerAgent();
      await league.startEpoch();
      const tasks = await league.getEpochTasks(1);
      // 执行第一个任务（Arbitrage）
      await league.connect(agent1).executeArbitrage(tasks[0], 0);
      const stats = await league.getAgentStats(agent1.address);
      expect(stats.successCount + stats.failCount).to.equal(1);
    });

    it("should prevent double execution", async function () {
      const { league, agent1 } = await loadFixture(deployFixture);
      await league.connect(agent1).registerAgent();
      await league.startEpoch();
      const tasks = await league.getEpochTasks(1);
      await league.connect(agent1).executeArbitrage(tasks[0], 0);
      await expect(
        league.connect(agent1).executeArbitrage(tasks[0], 0)
      ).to.be.revertedWith("Already executed");
    });

    it("should reject unregistered agent", async function () {
      const { league, agent4 } = await loadFixture(deployFixture);
      await league.startEpoch();
      const tasks = await league.getEpochTasks(1);
      await expect(
        league.connect(agent4).executeArbitrage(tasks[0], 0)
      ).to.be.revertedWith("Not registered");
    });
  });

  describe("Staking", function () {
    it("should allow staking tokens", async function () {
      const { token, agent1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");
      await token.connect(agent1).approve(await token.getAddress(), amount);
      // stake 需要先 approve 给 token 合约自身（因为 _transfer 内部调用）
      await token.connect(agent1).stake(amount);
      expect(await token.stakedAmount(agent1.address)).to.equal(amount);
    });

    it("should allow unstaking", async function () {
      const { token, agent1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");
      await token.connect(agent1).stake(amount);
      await token.connect(agent1).unstake(amount);
      expect(await token.stakedAmount(agent1.address)).to.equal(0);
    });
  });

  describe("Leaderboard", function () {
    it("should return leaderboard", async function () {
      const { league, agent1, agent2 } = await loadFixture(deployFixture);
      await league.connect(agent1).registerAgent();
      await league.connect(agent2).registerAgent();
      const [addrs, scores] = await league.getLeaderboard(5);
      expect(addrs.length).to.equal(2);
    });
  });

  describe("Score Weights", function () {
    it("should update score weights", async function () {
      const { league } = await loadFixture(deployFixture);
      await league.setScoreWeights(50, 40, 10);
      expect(await league.profitWeight()).to.equal(50);
      expect(await league.successWeight()).to.equal(40);
    });

    it("should reject invalid weights", async function () {
      const { league } = await loadFixture(deployFixture);
      await expect(league.setScoreWeights(50, 40, 20)).to.be.revertedWith("Weights must sum to 100");
    });
  });
});
