/**
 * Epoch 自动触发器
 * 每隔 EPOCH_INTERVAL 秒自动调用 startEpoch / closeEpoch
 */
import { ethers } from "ethers";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEAGUE_ABI = JSON.parse(
  readFileSync(join(__dirname, "abi/SpeculationAgentLeague.json"), "utf-8")
) as string[];

interface EpochConfig {
  rpcUrl: string;
  privateKey: string;
  leagueAddress: string;
  intervalMs: number;
}

function loadConfig(): EpochConfig {
  const rpcUrl = process.env.MONAD_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const leagueAddress = process.env.LEAGUE_ADDRESS;
  if (!rpcUrl || !privateKey || !leagueAddress) {
    throw new Error("缺少环境变量: MONAD_RPC_URL, PRIVATE_KEY, LEAGUE_ADDRESS");
  }
  const intervalSec = Number(process.env.EPOCH_INTERVAL) || 30;
  return { rpcUrl, privateKey, leagueAddress, intervalMs: intervalSec * 1000 };
}

function createContract(config: EpochConfig) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);
  return new ethers.Contract(config.leagueAddress, LEAGUE_ABI, wallet);
}

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function runEpochCycle(league: ethers.Contract, maxRetries = 3) {
  // 1. 检查当前 epoch 状态
  const epochId = (await league.currentEpochId()) as bigint;

  if (epochId > 0n) {
    const epoch = await league.epochs(epochId);
    const closed = epoch[3] as boolean;

    if (!closed) {
      // 当前 epoch 未关闭，尝试关闭
      log(`关闭 Epoch #${epochId}...`);
      const closeTx = await retryTx(() => league.closeEpoch(), maxRetries);
      log(`Epoch #${epochId} 已关闭, gas: ${closeTx.gasUsed.toString()}`);
    }
  }

  // 2. 开启新 epoch
  const newId = epochId + 1n;
  log(`开启 Epoch #${newId}...`);
  const startTx = await retryTx(() => league.startEpoch(), maxRetries);
  log(`Epoch #${newId} 已开启, gas: ${startTx.gasUsed.toString()}`);
}

async function retryTx(
  fn: () => Promise<ethers.ContractTransactionResponse>,
  maxRetries: number
): Promise<ethers.TransactionReceipt> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tx = await fn();
      const receipt = await tx.wait();
      if (!receipt) throw new Error("交易回执为空");
      return receipt;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log(`尝试 ${attempt}/${maxRetries} 失败: ${message}`);
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw new Error("不可达");
}

async function main() {
  const config = loadConfig();
  const league = createContract(config);

  log("Epoch 调度器启动");
  log(`合约: ${config.leagueAddress}`);
  log(`间隔: ${config.intervalMs / 1000}s`);

  // 立即执行一次
  try {
    await runEpochCycle(league);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log(`首次执行失败: ${message}`);
  }

  // 定时循环
  setInterval(async () => {
    try {
      await runEpochCycle(league);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log(`Epoch 循环失败: ${message}`);
    }
  }, config.intervalMs);
}

main().catch(console.error);
