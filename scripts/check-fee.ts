import { createPublicClient, http, type Chain } from 'viem';

const chain: Chain = {
  id: 10143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://monad-testnet.drpc.org'] } },
};

const curveAbi = [{
  type: 'function' as const, name: 'feeConfig', inputs: [],
  outputs: [
    { name: 'deployFeeAmount', type: 'uint256' },
    { name: 'graduateFeeAmount', type: 'uint256' },
    { name: 'protocolFee', type: 'uint24' },
  ],
  stateMutability: 'view' as const,
}] as const;

async function main() {
  const client = createPublicClient({ chain, transport: http('https://monad-testnet.drpc.org') });
  const result = await client.readContract({
    address: '0x1228b0dc9481C11D3071E7A924B794CfB038994e',
    abi: curveAbi,
    functionName: 'feeConfig',
  });
  console.log('Deploy fee:', Number(result[0]) / 1e18, 'MON');
  console.log('Graduate fee:', Number(result[1]) / 1e18, 'MON');

  // 查余额
  const balance = await client.getBalance({ address: '0xbf0C97581a7f34d99F4C2b5230A73197d65c9027' });
  console.log('Balance:', Number(balance) / 1e18, 'MON');
  console.log('Can create tokens:', Math.floor(Number(balance) / Number(result[0])));
}

main();
