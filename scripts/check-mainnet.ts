/**
 * 检查 Monad 主网余额和 nad.fun deploy fee
 * 用法: PRIVATE_KEY=0x... npx tsx scripts/check-mainnet.ts
 */
import { createPublicClient, http, formatEther, type Address, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Hex } from 'viem';

const chain: Chain = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://monad-mainnet.drpc.org'] } },
};

const CURVE = '0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE' as Address;

const curveAbi = [
  {
    type: 'function', name: 'feeConfig', inputs: [],
    outputs: [
      { name: 'deployFeeAmount', type: 'uint256' },
      { name: 'graduateFeeAmount', type: 'uint256' },
      { name: 'protocolFee', type: 'uint24' },
    ],
    stateMutability: 'view',
  },
] as const;

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) { console.error('❌ 缺少 PRIVATE_KEY'); process.exit(1); }

  const account = privateKeyToAccount(pk as Hex);
  const client = createPublicClient({ chain, transport: http() });

  const balance = await client.getBalance({ address: account.address });
  console.log(`🔑 地址: ${account.address}`);
  console.log(`💰 余额: ${formatEther(balance)} MON`);

  const feeConfig = await client.readContract({
    address: CURVE,
    abi: curveAbi,
    functionName: 'feeConfig',
  });
  console.log(`📋 Deploy Fee: ${formatEther(feeConfig[0])} MON`);
  console.log(`📋 Graduate Fee: ${formatEther(feeConfig[1])} MON`);
  console.log(`📋 Protocol Fee: ${feeConfig[2]}`);

  const needed = feeConfig[0] + 100000000000000000n; // fee + 0.1 MON gas buffer
  if (balance >= needed) {
    console.log(`\n✅ 余额充足，可以创建 token`);
  } else {
    console.log(`\n❌ 余额不足，至少需要 ${formatEther(needed)} MON`);
  }
}

main().catch(console.error);
