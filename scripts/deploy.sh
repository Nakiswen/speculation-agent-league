#!/bin/bash
# ============================================================
# SAL 一键部署脚本
# 用法:
#   ./scripts/deploy.sh local    # 部署到本地 Anvil
#   ./scripts/deploy.sh testnet  # 部署到 Monad Testnet
#   ./scripts/deploy.sh mainnet  # 部署到 Monad Mainnet
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$ROOT_DIR/contracts"
BACKEND_DIR="$ROOT_DIR/backend"

ENV=${1:-local}

echo "🚀 SAL 部署 — 环境: $ENV"
echo "================================"

# ── 加载环境配置 ──
ENV_FILE="$ROOT_DIR/envs/.env.$ENV"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ 环境配置不存在: $ENV_FILE"
  echo "请先复制模板: cp envs/.env.example envs/.env.$ENV"
  exit 1
fi

source "$ENV_FILE"

# 验证必要变量
if [ -z "$RPC_URL" ] || [ -z "$PRIVATE_KEY" ]; then
  echo "❌ 缺少必要环境变量: RPC_URL, PRIVATE_KEY"
  exit 1
fi

echo "📡 RPC: $RPC_URL"

# ── 1. 部署合约 ──
echo ""
echo "📦 Step 1: 部署合约..."

cd "$CONTRACTS_DIR"

# 写入临时 .env 给 forge 用
cat > .env <<EOF
PRIVATE_KEY=$PRIVATE_KEY
MONAD_RPC_URL=$RPC_URL
EOF

FORGE_ARGS="--rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast"

if [ "$ENV" = "local" ]; then
  # 本地不需要验证
  FORGE_ARGS="$FORGE_ARGS"
else
  # 非本地环境增加确认和 gas 设置
  FORGE_ARGS="$FORGE_ARGS --slow"
fi

echo "  forge script Deploy.s.sol $FORGE_ARGS"
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol $FORGE_ARGS 2>&1)
echo "$DEPLOY_OUTPUT"

# 从输出中提取合约地址
SAL_TOKEN=$(echo "$DEPLOY_OUTPUT" | grep "SALToken deployed to:" | awk '{print $NF}')
FACTORY=$(echo "$DEPLOY_OUTPUT" | grep "AgentFactory deployed to:" | awk '{print $NF}')
LEAGUE=$(echo "$DEPLOY_OUTPUT" | grep "League deployed to:" | awk '{print $NF}')

if [ -z "$SAL_TOKEN" ] || [ -z "$FACTORY" ] || [ -z "$LEAGUE" ]; then
  echo "❌ 无法从部署输出中提取合约地址"
  exit 1
fi

echo ""
echo "✅ 合约部署成功:"
echo "  SALToken:     $SAL_TOKEN"
echo "  AgentFactory: $FACTORY"
echo "  League:       $LEAGUE"

# ── 2. 更新后端 .env ──
echo ""
echo "📝 Step 2: 更新后端配置..."

cat > "$BACKEND_DIR/.env" <<EOF
# 自动生成 — 环境: $ENV — $(date)
MONAD_RPC_URL=$RPC_URL
PRIVATE_KEY=$PRIVATE_KEY
LEAGUE_ADDRESS=$LEAGUE
SAL_TOKEN_ADDRESS=$SAL_TOKEN
FACTORY_ADDRESS=$FACTORY
EPOCH_INTERVAL=${EPOCH_INTERVAL:-30}
INDEXER_PORT=${INDEXER_PORT:-3001}
EOF

echo "  ✅ backend/.env 已更新"

# ── 3. 运行 Demo 脚本（可选） ──
if [ "$RUN_DEMO" = "true" ]; then
  echo ""
  echo "🎮 Step 3: 运行 Demo..."

  # 写入合约地址给 Demo 脚本
  cat > .env <<EOF
PRIVATE_KEY=$PRIVATE_KEY
MONAD_RPC_URL=$RPC_URL
SAL_TOKEN_ADDRESS=$SAL_TOKEN
LEAGUE_ADDRESS=$LEAGUE
FACTORY_ADDRESS=$FACTORY
EOF

  forge script script/Demo.s.sol --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --slow 2>&1
  echo "  ✅ Demo 完成"
fi

# ── 4. 输出摘要 ──
echo ""
echo "================================"
echo "🎉 部署完成！"
echo ""
echo "环境:        $ENV"
echo "RPC:         $RPC_URL"
echo "SALToken:    $SAL_TOKEN"
echo "Factory:     $FACTORY"
echo "League:      $LEAGUE"
echo ""
echo "下一步:"
echo "  1. 启动后端:  cd backend && npx tsx src/indexer.ts"
echo "  2. 启动前端:  cd frontend && npm run dev"
if [ "$ENV" != "local" ]; then
  echo "  3. 前端 .env: NEXT_PUBLIC_API_URL=http://localhost:3001"
fi
echo "================================"
