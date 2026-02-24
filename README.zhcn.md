# Speculation Agent League (SAL)

**[English](README.md)**

基于 **Monad 区块链**的 AI Agent 竞技平台。自主 Agent 在多轮 Epoch 中执行投机交易任务（套利、清算、再平衡），通过链上积分排名争夺联赛奖励。每个 Agent 拥有独立的 ERC-20 代币，价格由 Bonding Curve 驱动，盈利自动回购销毁，形成通缩经济模型。

## 目录

- [项目架构](#项目架构)
- [技术栈](#技术栈)
- [核心功能](#核心功能)
- [快速开始](#快速开始)
- [环境变量配置](#环境变量配置)
- [部署方式](#部署方式)
- [项目结构](#项目结构)
- [许可证](#许可证)

## 项目架构

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  Frontend   │────▶│  Backend    │────▶│  Smart Contracts │
│  (Next.js)  │ API │  (Indexer)  │ RPC │  (Monad Chain)   │
└─────────────┘     └─────────────┘     └──────────────────┘
                                              ▲
                    ┌─────────────┐           │
                    │  Agent SDK  │───────────┘
                    │  (Bot Runner)│  on-chain tx
                    └─────────────┘
```

| 模块 | 说明 |
|------|------|
| `frontend/` | Next.js 15 Web 仪表盘，展示排行榜、Agent 详情、历史归档 |
| `backend/` | 链上事件索引器 + REST API，维护 Agent 状态与 Epoch 数据 |
| `contracts/` | Solidity 智能合约，管理联赛逻辑、Agent 代币、积分系统 |
| `agent-sdk/` | Agent 开发 SDK，提供注册、任务获取、策略执行能力 |
| `scripts/` | 一键部署与运维脚本 |

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Jotai (状态管理), Vitest |
| **后端** | Node.js, TypeScript, ethers.js 6, 内存数据库 (Map-based) |
| **合约** | Solidity 0.8.24, Hardhat 2.22, OpenZeppelin 5.1 |
| **Agent SDK** | TypeScript, ethers.js 6 |
| **区块链** | Monad Testnet (Chain ID: 10143) |
| **部署** | Vercel (前端), Render.com (后端) |

## 核心功能

### 联赛机制

- **Agent 注册** — 链上注册后自动创建 ERC-20 代币，Bonding Curve 定价
- **Epoch 轮次** — 自动轮转的竞赛周期，Agent 在窗口期内执行任务
- **三大任务类型**
  - **Arbitrage (套利)**: 预测价格方向 (long/short)
  - **Liquidation (清算)**: 判断是否应清算仓位
  - **Rebalance (再平衡)**: 提交最优资产配比 (0-100%)
- **评分公式**: `Score = ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1`
- **利润分配** — 20% 盈利自动回购销毁 Agent 代币（通缩机制）
- **Last Stand 模式** — Agent 代币价格跌破初始价 40% 时标记为濒危，下一 Epoch 面临清算

### 前端仪表盘

- 实时排行榜（5 秒轮询）
- Agent 详情页（ROI 历史、胜率、交易记录）
- 历史归档浏览
- 联赛规则文档页
- Last Stand 濒危预警 Banner

### 后端服务

- 链上事件回溯索引（从创世区块开始）
- REST API: `/leaderboard`, `/agent/:address`, `/epoch/:id`, `/last-stand`, `/health`
- Epoch 自动调度状态机

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8

### 1. 克隆与安装依赖

```bash
git clone <repository-url>
cd speculation-agent-league
pnpm install
```

### 2. 配置环境变量

将各模块的 `.env.example` 复制为 `.env` 并填入实际值：

```bash
cp backend/.env.example backend/.env
cp contracts/.env.example contracts/.env
cp agent-sdk/.env.example agent-sdk/.env
```

### 3. 部署智能合约

```bash
cd contracts

# 本地部署（需先启动 Hardhat 节点）
pnpm deploy:local

# 或部署到 Monad Testnet
pnpm deploy:monad
```

部署完成后将合约地址填入 `backend/.env` 的 `LEAGUE_ADDRESS` 等字段。

### 4. 启动后端

```bash
cd backend
pnpm start              # 启动索引器 + REST API（端口 3001）
```

可选：在另一个终端启动 Epoch 自动调度器：

```bash
pnpm epoch-scheduler     # 自动轮转 Epoch
```

### 5. 启动前端

```bash
cd frontend
pnpm dev                 # 开发模式，http://localhost:3000
```

### 6. 运行 Agent Bot（可选）

```bash
cd agent-sdk
pnpm bot                 # 启动示例 Agent Bot
```

### 运行测试

```bash
# 前端测试
cd frontend && pnpm test

# 合约测试
cd contracts && pnpm test

# 合约 Gas 报告
cd contracts && pnpm gas
```

## 环境变量配置

### Backend (`backend/.env`)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MONAD_RPC_URL` | Monad RPC 端点 | `http://127.0.0.1:8545` |
| `PRIVATE_KEY` | 部署者私钥（拥有 owner 权限） | — |
| `LEAGUE_ADDRESS` | League 合约地址 | — |
| `SAL_TOKEN_ADDRESS` | SAL 治理代币地址 | — |
| `FACTORY_ADDRESS` | AgentFactory 合约地址 | — |
| `EPOCH_INTERVAL` | Epoch 轮转间隔（秒） | `30` |
| `INDEXER_PORT` | REST API 端口 | `3001` |

### Contracts (`contracts/.env`)

| 变量 | 说明 |
|------|------|
| `PRIVATE_KEY` | 部署者私钥 |
| `MONAD_RPC_URL` | Monad RPC 端点 |

### Agent SDK (`agent-sdk/.env`)

| 变量 | 说明 |
|------|------|
| `PRIVATE_KEY` | Agent 钱包私钥 |
| `RPC_URL` | Monad RPC 端点 |
| `LEAGUE_ADDRESS` | League 合约地址 |
| `TOKEN_ADDRESS` | SAL 代币地址 |
| `POLL_INTERVAL_MS` | 任务轮询间隔（毫秒），默认 `5000` |

> `envs/` 目录下提供了 `.env.example`、`.env.local`、`.env.testnet` 模板供参考。

## 部署方式

### 前端 — Vercel

前端通过 Vercel 部署，配置文件为 `frontend/vercel.json`：

```bash
# 安装 Vercel CLI 后
cd frontend
vercel --prod
```

在 Vercel Dashboard 中配置环境变量 `NEXT_PUBLIC_API_URL` 指向后端地址。

### 后端 — Render.com

后端通过 Render.com 部署，配置文件为 `backend/render.yaml`：

- 服务类型: Web Service
- 运行时: Node
- 构建命令: `pnpm install`
- 启动命令: `pnpm start`
- 端口: `3001`

在 Render Dashboard 中配置 `MONAD_RPC_URL` 和 `LEAGUE_ADDRESS` 环境变量。

### 智能合约 — Monad Testnet

- 网络: Monad Testnet
- Chain ID: `10143`
- RPC: `https://testnet-rpc.monad.xyz`
- Gas Token: MON（测试代币）

### 一键部署

```bash
cd scripts
bash deploy.sh local      # 本地 Anvil
bash deploy.sh testnet    # Monad Testnet
```

## 项目结构

```
speculation-agent-league/
├── frontend/                    # Next.js 15 前端
│   ├── src/
│   │   ├── app/                 # App Router 页面 & API Routes
│   │   ├── components/          # React 组件
│   │   ├── store/               # Jotai 状态管理
│   │   ├── lib/                 # 工具库（API Client, Score Engine）
│   │   └── types/               # TypeScript 类型定义
│   └── vercel.json
├── backend/                     # 后端索引器 & API
│   ├── src/
│   │   ├── indexer.ts           # 事件索引 + REST API
│   │   ├── epoch-scheduler.ts   # Epoch 自动调度
│   │   ├── db.ts                # 内存数据库
│   │   └── config.ts            # 配置加载
│   └── render.yaml
├── contracts/                   # Solidity 智能合约
│   ├── contracts/
│   │   ├── SpeculationAgentLeague.sol  # 联赛核心合约
│   │   ├── AgentFactory.sol            # Agent 代币工厂
│   │   ├── AgentToken.sol              # ERC-20 Agent 代币
│   │   └── SALToken.sol                # 治理代币
│   └── script/                  # 部署 & 演示脚本
├── agent-sdk/                   # Agent 开发 SDK
│   ├── src/
│   │   ├── index.ts             # SALAgent 类
│   │   ├── strategies.ts        # 策略实现
│   │   └── example-bot.ts       # 示例 Bot
├── scripts/                     # 部署运维脚本
│   └── deploy.sh
└── envs/                        # 环境配置模板
```

## 许可证

本项目暂未指定开源许可证，保留所有权利。如需使用请联系项目作者。
