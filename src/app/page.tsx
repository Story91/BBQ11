"use client";

import { Button } from "@/components/ui/button";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useConnections,
} from "wagmi";
import WorldBuilder from "../components/world-builder";
import SubAccountManager from "../components/SubAccountManager";
import { useMemo, useState } from "react";
import SplitText from "../components/animations/SplitText";
import TargetCursor from "../components/animations/TargetCursor";
import AuroraBackground from "../components/animations/AuroraBackground";
import ParallaxCard, { FloatingElement } from "../components/animations/ParallaxCard";
import ParticleSystem from "../components/animations/ParticleSystem";
import SplashScreen from "../components/animations/SplashScreen";
import { Wallet, Map as MapIcon } from "lucide-react";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const account = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const connections = useConnections();
  const [_subAccount, universalAccount] = useMemo(() => {
    const accounts = connections.flatMap((connection) => connection.accounts);
    return [accounts[0] || null, accounts[1] || null];
  }, [connections]);

  // Get universal account ETH balance
  const { data: universalBalance } = useBalance({
    address: universalAccount,
    query: {
      refetchInterval: 1000,
      enabled: !!universalAccount,
    },
  });

  if (showSplash) {
    return (
      <SplashScreen 
        onComplete={() => setShowSplash(false)}
        duration={3000}
        title="🌍 World Builder"
        subtitle="Building the future of virtual worlds with Base Account"
      />
    );
  }

  return (
    <>
      <AuroraBackground intensity={0.2} speed={0.8} />
      <ParticleSystem particleCount={15} speed={0.5} size={3} />
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor={true}
      />
      <main className="flex min-h-screen flex-col items-center justify-between px-4 pb-4 md:pb-8 md:px-8 relative z-10">
        <div className="w-full max-w-7xl mx-auto">
          <nav className="flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md z-20 py-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapIcon className="w-4 h-4 text-white" />
              </div>
              <SplitText 
                text="🌍 World Builder" 
                animationType="bounce"
                className="text-xl font-bold"
                delay={0.2}
              />
            </div>
          {account.status === "connected" ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xs text-muted-foreground">
                  Base: {universalAccount?.slice(0, 6)}...
                  {universalAccount?.slice(-4)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({universalBalance?.formatted.slice(0, 6)}{" "}
                  ETH)
                </span>
              </div>

              <SubAccountManager>
                <Button variant="outline" size="sm" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  Accounts
                </Button>
              </SubAccountManager>

              <Button variant="outline" onClick={() => disconnect()} size="sm">
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {connectors.slice(0, 1).map((connector) => (
                <Button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  size="sm"
                >
                  {connector.name}
                </Button>
              ))}
            </div>
          )}
          </nav>

          <WorldBuilder />
        </div>
      </main>
    </>
  );
}

export default App;
