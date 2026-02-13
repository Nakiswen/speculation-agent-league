/**
 * 简易本地区块链浏览器 HTML 页面
 */

export function getExplorerHtml(apiBase: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SAL Local Explorer</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0e17; color: #e2e8f0; font-family: 'SF Mono', 'Fira Code', monospace; padding: 24px; }
  h1 { font-size: 20px; color: #22d3ee; margin-bottom: 8px; }
  .subtitle { font-size: 12px; color: #64748b; margin-bottom: 24px; }
  .section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  .section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 8px 12px; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  td { padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .addr { color: #22d3ee; font-size: 11px; }
  .success { color: #34d399; }
  .fail { color: #f87171; }
  .profit-pos { color: #34d399; }
  .profit-neg { color: #f87171; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; }
  .badge-open { background: rgba(34,211,238,0.1); color: #22d3ee; }
  .badge-closed { background: rgba(100,116,139,0.2); color: #94a3b8; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; text-align: center; }
  .stat-value { font-size: 24px; font-weight: bold; color: #fff; }
  .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .refresh-btn { background: rgba(34,211,238,0.1); color: #22d3ee; border: 1px solid rgba(34,211,238,0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: bold; }
  .refresh-btn:hover { background: rgba(34,211,238,0.2); }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .tx-hash { color: #a78bfa; font-size: 10px; }
  #loading { color: #64748b; font-style: italic; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>⛓ SAL Local Explorer</h1>
    <div class="subtitle">Speculation Agent League — 本地链上数据浏览器</div>
  </div>
  <button class="refresh-btn" onclick="loadAll()">🔄 刷新</button>
</div>

<div class="stats" id="stats">
  <div class="stat-card"><div class="stat-value" id="s-agents">-</div><div class="stat-label">Agents</div></div>
  <div class="stat-card"><div class="stat-value" id="s-epochs">-</div><div class="stat-label">Epochs</div></div>
  <div class="stat-card"><div class="stat-value" id="s-execs">-</div><div class="stat-label">Executions</div></div>
  <div class="stat-card"><div class="stat-value" id="s-status">-</div><div class="stat-label">Status</div></div>
</div>

<div class="section">
  <h2>🏆 排行榜</h2>
  <table id="leaderboard"><tr><td id="loading">加载中...</td></tr></table>
</div>

<div class="section">
  <h2>📜 最近执行记录</h2>
  <table id="executions"><tr><td>加载中...</td></tr></table>
</div>

<script>
const API = '${apiBase}';
const NAMES = {
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': 'MomentumBot',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': 'MeanRevertBot',
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906': 'RandomBot',
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65': 'ConservativeBot',
  '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc': 'AggroBot',
};
function name(addr) { return NAMES[addr] || addr.slice(0,10)+'...'; }
function shortAddr(a) { return a.slice(0,6)+'...'+a.slice(-4); }
function fmtProfit(p) {
  const n = parseFloat(p);
  if (isNaN(n)) return '0';
  const eth = n / 1e18;
  if (Math.abs(eth) > 1) return (eth > 0 ? '+' : '') + eth.toFixed(2) + ' SAL';
  return (n > 0 ? '+' : '') + n.toFixed(0) + ' wei';
}

async function loadAll() {
  try {
    const [health, lb] = await Promise.all([
      fetch(API+'/health').then(r=>r.json()),
      fetch(API+'/leaderboard').then(r=>r.json()),
    ]);
    document.getElementById('s-agents').textContent = health.agents;
    document.getElementById('s-epochs').textContent = health.epochs;
    document.getElementById('s-execs').textContent = health.executions;
    document.getElementById('s-status').textContent = '🟢 在线';

    // 排行榜
    let html = '<tr><th>#</th><th>Agent</th><th>地址</th><th>成功</th><th>失败</th><th>胜率</th><th>评分</th></tr>';
    lb.forEach((a, i) => {
      const total = a.success_count + a.fail_count;
      const wr = total > 0 ? ((a.success_count/total)*100).toFixed(1)+'%' : '-';
      const score = parseFloat(a.score).toExponential(2);
      html += '<tr>'
        + '<td>'+(i+1)+'</td>'
        + '<td><b>'+name(a.address)+'</b></td>'
        + '<td class="addr">'+shortAddr(a.address)+'</td>'
        + '<td class="success">'+a.success_count+'</td>'
        + '<td class="fail">'+a.fail_count+'</td>'
        + '<td>'+wr+'</td>'
        + '<td>'+score+'</td>'
        + '</tr>';
    });
    document.getElementById('leaderboard').innerHTML = html;

    // 执行记录 — 从每个 epoch 获取
    let allExecs = [];
    for (let eid = 1; eid <= health.epochs; eid++) {
      try {
        const ep = await fetch(API+'/epoch/'+eid).then(r=>r.json());
        if (ep.executions) allExecs = allExecs.concat(ep.executions);
      } catch(e) {}
    }
    allExecs.sort((a,b) => b.id - a.id);

    let ehtml = '<tr><th>#</th><th>Agent</th><th>Task</th><th>结果</th><th>盈亏</th><th>TX Hash</th></tr>';
    allExecs.slice(0, 50).forEach(e => {
      const cls = e.success ? 'success' : 'fail';
      const profitCls = parseFloat(e.profit) >= 0 ? 'profit-pos' : 'profit-neg';
      ehtml += '<tr>'
        + '<td>'+e.id+'</td>'
        + '<td><b>'+name(e.agent)+'</b></td>'
        + '<td>#'+e.task_id+'</td>'
        + '<td class="'+cls+'">'+(e.success?'✅ 成功':'❌ 失败')+'</td>'
        + '<td class="'+profitCls+'">'+fmtProfit(e.profit)+'</td>'
        + '<td class="tx-hash">'+e.tx_hash.slice(0,18)+'...</td>'
        + '</tr>';
    });
    document.getElementById('executions').innerHTML = ehtml;

  } catch(err) {
    document.getElementById('s-status').textContent = '🔴 离线';
    console.error(err);
  }
}
loadAll();
setInterval(loadAll, 5000);
</script>
</body>
</html>`;
}
