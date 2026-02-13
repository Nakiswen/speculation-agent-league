import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. 部署 SALToken
  const SALToken = await ethers.getContractFactory("SALToken");
  const salToken = await SALToken.deploy();
  await salToken.waitForDeployment();
  const tokenAddr = await salToken.getAddress();
  console.log("SALToken deployed to:", tokenAddr);

  // 2. 部署 SpeculationAgentLeague
  const League = await ethers.getContractFactory("SpeculationAgentLeague");
  const league = await League.deploy(tokenAddr);
  await league.waitForDeployment();
  const leagueAddr = await league.getAddress();
  console.log("SpeculationAgentLeague deployed to:", leagueAddr);

  // 3. 将 league 设为 token 的 owner（用于 mint/slash）
  await salToken.transferOwnership(leagueAddr);
  console.log("Token ownership transferred to league");

  console.log("\n--- Deployment Summary ---");
  console.log("SALToken:", tokenAddr);
  console.log("League:", leagueAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
