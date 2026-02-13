/**
 * 链上事件索引器 + REST API
 * 监听 EpochStarted / EpochClosed / TaskExecuted / AgentRegistered
 * 提供 /leaderboard, /agent/:address, /epoch/:id API
 */
import { ethers } from "ethers";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  createDb,
  upsertAgent,
  addExecution,
  updateAgentStats,
  getLeaderboard,
  getAgentExecutions,
  getEpochExecutions,
  type MemoryDb,
} from "./db.js";
import { AGENT_TOKEN_ABI, AGENT_FACTORY_ABI } from "./abi.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEAGUE_ABI = JSON.parse(
  readFileSync(join(__dirname, "abi/SpeculationAgentLeague.json"), "utf-8")
) as string[];

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

interface IndexerConfig {
  rpcUrl: string;
  leagueAddress: string;
  port: number;
}

function loadConfig(): IndexerConfig {
  const rpcUrl = process.env.MONAD_RPC_URL;
  const leagueAddress = process.env.LEAGUE_ADDRESS;
  if (!rpcUrl || !leagueAddress) {
    throw new Error("缺少环境变量: MONAD_RPC_URL, LEAGUE_ADDRESS");
  }
  return {
    rpcUrl,
    leagueAddress,
    port: Number(process.env.INDEXER_PORT) || 3001,
  };
}

async function backfillFromChain(league: ethers.Contract, db: MemoryDb) {
  log("回填链上历史数据...");
  try {
    // 获取已注册 Agent 数量
    const agentCount = Number(await league.getRegisteredAgentCount());
    for (let i = 0; i < agentCount; i++) {
      const addr = (await league.registeredAgents(i)) as string;
      upsertAgent(db, addr);
    }
    log(`回填 ${agentCount} 个 Agent`);

    // 获取当前 epoch
    const currentEpoch = Number(await league.currentEpochId());
    for (let epochId = 1; epochId <= currentEpoch; epochId++) {
      const epoch = await league.epochs(epochId);
      db.epochs.set(epochId, {
        id: epochId,
        start_time: Number(epoch[1]),
        end_time: Number(epoch[2]),
        closed: epoch[3] ? 1 : 0,
      });
    }
    log(`回填 ${currentEpoch} 个 Epoch`);

    // 回填事件
    const filter = league.filters.TaskExecuted();
    const events = await league.queryFilter(filter, 0, "latest");
    for (const event of events) {
      if (!("args" in event)) continue;
      const e = event as ethers.EventLog;
      const taskId = Number(e.args[0]);
      const agent = e.args[1] as string;
      const success = e.args[2] as boolean;
      const profit = (e.args[3] as bigint).toString();

      addExecution(db, {
        task_id: taskId,
        agent,
        success: success ? 1 : 0,
        profit,
        block_number: e.blockNumber,
        tx_hash: e.transactionHash,
        timestamp: Math.floor(Date.now() / 1000),
      });
      updateAgentStats(db, agent);
    }
    log(`回填 ${events.length} 条执行记录`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`回填失败: ${msg}`);
  }
}

/** Last Stand 响应数据结构 */
interface LastStandInfo {
  active: boolean;
  epochRemainingPct: number;
  epochRemainingSeconds: number;
  endangeredAgents: EndangeredAgent[];
}

interface EndangeredAgent {
  address: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  currentPrice: string;
  basePrice: string;
  deathLinePrice: string;
  priceRatio: number;       // currentPrice / basePrice (0~1)
  belowDeathLine: boolean;
  alive: boolean;
}

async function queryLastStand(
  league: ethers.Contract,
  factory: ethers.Contract,
  provider: ethers.JsonRpcProvider,
): Promise<LastStandInfo> {
  const currentEpochId = Number(await league.currentEpochId());
  if (currentEpochId === 0) {
    return { active: false, epochRemainingPct: 100, epochRemainingSeconds: 0, endangeredAgents: [] };
  }

  const epoch = await league.epochs(currentEpochId);
  const startTime = Number(epoch[1]);
  const closed = epoch[3] as boolean;
  const duration = Number(await league.epochDuration());
  const now = Math.floor(Date.now() / 1000);
  const endTime = startTime + duration;
  const remaining = Math.max(0, endTime - now);
  const remainingPct = duration > 0 ? (remaining / duration) * 100 : 100;

  // 查询所有 Agent 的 Token 状态
  const agentCount = Number(await league.getRegisteredAgentCount());
  const endangered: EndangeredAgent[] = [];

  for (let i = 0; i < agentCount; i++) {
    try {
      const agentAddr = (await league.registeredAgents(i)) as string;
      const tokenAddr = (await factory.getAgentToken(agentAddr)) as string;
      if (tokenAddr === ethers.ZeroAddress) continue;

      const token = new ethers.Contract(tokenAddr, AGENT_TOKEN_ABI, provider);
      const [curPrice, basePrc, belowDeath, alive] = await Promise.all([
        token.currentPrice() as Promise<bigint>,
        token.basePrice() as Promise<bigint>,
        token.isBelowDeathLine() as Promise<boolean>,
        factory.isAgentAlive(agentAddr) as Promise<boolean>,
      ]);

      const deathLine = (basePrc * 4000n) / 10000n; // 40%
      const ratio = basePrc > 0n ? Number(curPrice * 10000n / basePrc) / 10000 : 1;

      // 濒危条件：价格 < basePrice 的 60%（接近 40% 死亡线）
      if (ratio < 0.6 || belowDeath) {
        const info = await factory.agentInfo(agentAddr);
        endangered.push({
          address: agentAddr,
          tokenAddress: tokenAddr,
          name: info[2] as string,
          symbol: info[3] as string,
          currentPrice: curPrice.toString(),
          basePrice: basePrc.toString(),
          deathLinePrice: deathLine.toString(),
          priceRatio: ratio,
          belowDeathLine: belowDeath,
          alive,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`查询 Agent Token 失败: ${msg}`);
    }
  }

  // Last Stand 激活条件：epoch 剩余 < 10% 且有濒危 Agent
  const isActive = !closed && remainingPct < 10 && endangered.length > 0;

  return {
    active: isActive,
    epochRemainingPct: Math.round(remainingPct * 100) / 100,
    epochRemainingSeconds: remaining,
    endangeredAgents: endangered,
  };
}

function startIndexer() {
  const config = loadConfig();
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const league = new ethers.Contract(config.leagueAddress, LEAGUE_ABI, provider);
  const factoryAddress = process.env.FACTORY_ADDRESS;
  const factory = factoryAddress
    ? new ethers.Contract(factoryAddress, AGENT_FACTORY_ABI, provider)
    : null;
  const db = createDb();

  // 回填历史数据
  backfillFromChain(league, db).then(() => {
    log(`回填完成，当前 ${db.agents.size} 个 Agent, ${db.executions.length} 条记录`);
  });

  // ── 实时事件监听 ──────────────────────────────────

  league.on("EpochStarted", (epochId: bigint, startTime: bigint) => {
    log(`EpochStarted #${epochId}`);
    db.epochs.set(Number(epochId), {
      id: Number(epochId),
      start_time: Number(startTime),
      end_time: 0,
      closed: 0,
    });
  });

  league.on("EpochClosed", (epochId: bigint, endTime: bigint) => {
    log(`EpochClosed #${epochId}`);
    const epoch = db.epochs.get(Number(epochId));
    if (epoch) {
      epoch.end_time = Number(endTime);
      epoch.closed = 1;
    }
  });

  league.on(
    "TaskExecuted",
    (taskId: bigint, agent: string, success: boolean, profit: bigint, event: ethers.EventLog) => {
      log(`TaskExecuted #${taskId} by ${agent} success=${success}`);
      addExecution(db, {
        task_id: Number(taskId),
        agent,
        success: success ? 1 : 0,
        profit: profit.toString(),
        block_number: event.blockNumber,
        tx_hash: event.transactionHash,
        timestamp: Math.floor(Date.now() / 1000),
      });
      updateAgentStats(db, agent);
    }
  );

  league.on("AgentRegistered", (agent: string) => {
    log(`AgentRegistered ${agent}`);
    upsertAgent(db, agent);
  });

  log(`索引器已启动，监听合约 ${config.leagueAddress}`);

  // ── REST API ──────────────────────────────────────

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === "HEAD") {
      res.statusCode = 200;
      res.end();
      return;
    }

    const url = req.url ?? "/";

    if (url === "/leaderboard") {
      res.end(JSON.stringify(getLeaderboard(db)));
      return;
    }

    const agentMatch = url.match(/^\/agent\/(.+)$/);
    if (agentMatch) {
      const address = agentMatch[1];
      const agent = db.agents.get(address) ?? db.agents.get(address.toLowerCase());
      if (!agent) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Agent not found" }));
        return;
      }
      const trades = getAgentExecutions(db, agent.address).slice(-50).reverse();
      res.end(JSON.stringify({ ...agent, recentTrades: trades }));
      return;
    }

    const epochMatch = url.match(/^\/epoch\/(\d+)$/);
    if (epochMatch) {
      const epochId = Number(epochMatch[1]);
      const epoch = db.epochs.get(epochId);
      if (!epoch) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Epoch not found" }));
        return;
      }
      const executions = getEpochExecutions(db, epochId);
      res.end(JSON.stringify({ ...epoch, executions }));
      return;
    }

    // Last Stand 查询
    if (url === "/last-stand") {
      if (!factory) {
        res.end(JSON.stringify({ active: false, epochRemainingPct: 100, epochRemainingSeconds: 0, endangeredAgents: [] }));
        return;
      }
      queryLastStand(league, factory, provider)
        .then((data) => res.end(JSON.stringify(data)))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          log(`Last Stand 查询失败: ${msg}`);
          res.end(JSON.stringify({ active: false, epochRemainingPct: 100, epochRemainingSeconds: 0, endangeredAgents: [] }));
        });
      return;
    }

    // 健康检查
    if (url === "/health") {
      res.end(JSON.stringify({
        status: "ok",
        agents: db.agents.size,
        executions: db.executions.length,
        epochs: db.epochs.size,
      }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.listen(config.port, () => {
    log(`REST API 运行在 http://localhost:${config.port}`);
  });
}

startIndexer();
