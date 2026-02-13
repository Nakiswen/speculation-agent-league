'use client';

import { useState, useCallback, useEffect } from 'react';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

/**
 * 钱包按钮 — 未连接时显示 Connect Wallet，连接后显示头像+地址
 */
export default function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // 监听账户变化
  useEffect(() => {
    if (!window.ethereum) return;
    const handler = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress(accounts.length > 0 ? accounts[0] : null);
    };
    window.ethereum.on('accountsChanged', handler);
    // 检查是否已连接
    window.ethereum.request({ method: 'eth_accounts' }).then((accs) => {
      const accounts = accs as string[];
      if (accounts.length > 0) setAddress(accounts[0]);
    });
    return () => {
      window.ethereum?.removeListener('accountsChanged', handler);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];
      if (accounts.length > 0) setAddress(accounts[0]);
    } catch {
      // 用户拒绝
    } finally {
      setConnecting(false);
    }
  }, []);

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  // 已连接：头像 + 地址
  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-white font-mono">{shortAddr}</span>
        <div className="w-10 h-10 rounded-xl p-[1.5px] bg-linear-to-br from-cyan-400 to-indigo-600">
          <div className="w-full h-full rounded-[9px] bg-[#010203] flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>
    );
  }

  // 未连接：Connect Wallet 按钮
  return (
    <button
      onClick={connect}
      disabled={connecting}
      className="px-5 py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-indigo-500 text-[10px] font-black text-white uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
