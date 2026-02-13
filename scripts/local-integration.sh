#!/bin/bash
# SAL 本地联调脚本
# 启动 Hardhat 节点 → 部署合约 → 运行 Demo 数据 → 启动 Indexer → 启动前端

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "🚀 SAL 本地联调启动"
echo "📁 项目根目录: $ROOT_DIR"

# 1. 启动 Hardhat 节点
echo ""
echo "=== 1. 启动 Hardhat 本地节点 ==="
cd "$ROOT_DIR/contracts"
npx hardhat node &
HARDHAT_PID=$!
echo "Hardhat PID: $HARDHAT_PID"
sleep 3

# 2. 部署合约
echo ""
echo "=== 2. 部署合约 ==="
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.ts --network localhost)
echo "$DEPLOY_OUTPUT"

# 提取合约地址
TOKEN_ADDR=$(echo "$DEPLOY_OUTPUT" | grep "SALToken deployed" | awk '{print $NF}')
LEAGUE_ADDR=$(echo "$DEPLOY_OUTPUT" | grep "SpeculationAgentLeague deployed" | awk '{print $NF}')
echo "SALToken: $TOKEN_ADDR"
echo "League: $LEAGUE_ADDR"

# 3. 写入后端 .env
echo ""
echo "=== 3. 配置后端环境变量 ==="
cat > "$ROOT_DIR/backend/.env" << EOF
MONAD_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
LEAGUE_ADDRESS=$LEAGUE_ADDR
SAL_TOKEN_ADDRESS=$TOKEN_ADDR
EPOCH_INTERVAL=30
INDEXER_PORT=3001
EOF
echo "✅ backend/.env 已生成"

# 4. 更新 demo 脚本中的合约地址并运行
echo ""
echo "=== 4. 运行 Demo 数据填充 ==="
# 使用 hardhat console 运行 demo
cd "$ROOT_DIR/contracts"
npx hardhat run scripts/local-demo.ts --network localhost

# 5. 启动后端 Indexer
echo ""
echo "=== 5. 启动后端 Indexer ==="
cd "$ROOT_DIR/backend"
npm run indexer &
INDEXER_PID=$!
echo "Indexer PID: $INDEXER_PID"
sleep 2

# 6. 启动前端
echo ""
echo "=== 6. 启动前端 ==="
cd "$ROOT_DIR/frontend"
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "✅ SAL 联调环境已启动"
echo "========================================="
echo "Hardhat 节点:  http://127.0.0.1:8545"
echo "Indexer API:   http://localhost:3001"
echo "前端:          http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待并清理
trap "kill $HARDHAT_PID $INDEXER_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
