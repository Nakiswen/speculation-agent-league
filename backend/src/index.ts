/**
 * SAL Backend 入口
 *
 * 当前架构下各服务独立运行：
 *   - Indexer + REST API:  npx tsx src/indexer.ts
 *   - Epoch 调度器:        npx tsx src/epoch-scheduler.ts
 *
 * 此文件提供统一入口，按需启动 indexer。
 */

async function main() {
  console.log("=== SAL Backend ===");
  console.log("启动 Indexer + REST API...");
  // 动态导入 indexer（它会自行启动）
  await import("./indexer.js");
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("启动失败:", msg);
  process.exit(1);
});
