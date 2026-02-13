/**
 * 查询主网余额和 deploy fee（只需地址，不需要私钥）
 */
import { createPublicClient, http, formatEther, type Address, type Chain } from 'viem';

const chain: Chain = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://monad-mainnet.drpc.org'] } },
};

const CURVE = '0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE' as Address;
const WALLET = '0xbf0C97581a7f34d99F4C2b5230A73197d65c9027' as Address;

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
  const client = createPublicClient({ chain, transport: http() });

  const balance = await client.getBalance({ address: WALLET });
  console.log(`🔑 地址: ${WALLET}`);
  console.log(`💰 主网余额: ${formatEther(balance)} MON`);

  try {
    const feeConfig = await client.readContract({
      address: CURVE,
      abi: curveAbi,
      functionName: 'feeConfig',
    });
    const deployFee = feeConfig[0];
    console.log(`📋 Deploy Fee: ${formatEther(deployFee)} MON`);

    const needed = deployFee + 100000000000000000n;
    if (balance >= needed) {
      console.log(`\n✅ 余额充足，可以创建 token`);
    } else {
      console.log(`\n❌ 余额不足，至少需要 ${formatEther(needed)} MON`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`⚠️ 读取 fee 失败: ${msg}`);
  }
}

main().catch(console.error);
