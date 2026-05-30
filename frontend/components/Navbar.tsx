"use client";

import Link from "next/link";
import { useWallet } from "../lib/genlayer/wallet";
import { Button } from "./ui/button";
import { Logo } from "./Logo";

export function Navbar() {
  const { address, isConnected, connect, disconnect } = useWallet();

  return (
    <nav className="border-b border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-bold text-white">AgentTrust</span>
        </Link>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <span className="text-sm text-gray-400 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="border-[#1a1a2e] text-gray-300 hover:bg-[#1a1a2e]"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={connect}
              className="bg-[#6366f1] hover:bg-[#5558e6] text-white"
            >
              Connect
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
