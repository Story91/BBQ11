"use client";

import { Button } from "@/components/ui/button";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useWaitForTransactionReceipt,
  useSendTransaction,
  useConnections,
} from "wagmi";
import WorldBuilder from "../components/world-builder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useEffect, useMemo } from "react";
import { parseUnits, isAddress, encodeFunctionData } from "viem";
import { toast } from "sonner";
import { USDC, erc20Abi } from "@/lib/usdc";
import { useFaucet } from "@/hooks/useFaucet";
import { useFaucetEligibility } from "@/hooks/useFaucetEligibility";

function App() {
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

  // Check faucet eligibility based on balance
  const faucetEligibility = useFaucetEligibility(universalBalance?.value);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [toastId, setToastId] = useState<string | number | null>(null);

  const faucetMutation = useFaucet();

  const {
    sendTransaction,
    data: hash,
    isPending: isTransactionPending,
    reset: resetTransaction,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleSend = useCallback(async () => {
    if (!amount || !isAddress(toAddress)) {
      toast.error("Invalid input", {
        description: "Please enter a valid address and amount",
      });
      return;
    }

    try {
      sendTransaction({
        to: toAddress as `0x${string}`,
        value: parseUnits(amount, 18), // ETH has 18 decimals
      });

      const toastId_ = toast("Sending ETH...", {
        description: `Sending ${amount} ETH to ${toAddress}`,
        duration: Infinity,
      });

      setToastId(toastId_);
      setIsDialogOpen(false);
      setAmount("");
      setToAddress("");
    } catch (_error) {
      toast.error("Transaction failed", {
        description: "Please try again",
      });
    }
  }, [amount, toAddress, sendTransaction]);

  useEffect(() => {
    if (isConfirmed && toastId !== null) {
      toast.success("Transaction successful!", {
        description: `Sent ${amount} ETH to ${toAddress}`,
        duration: 2000,
      });

      setTimeout(() => {
        toast.dismiss(toastId);
      }, 0);

      setToastId(null);
      resetTransaction();
    }
  }, [isConfirmed, toastId, amount, toAddress, resetTransaction]);

  const handleFundAccount = useCallback(() => {
    setIsFundDialogOpen(true);
  }, []);

  const handleTransferToSubAccount = useCallback(async () => {
    if (!universalAccount || !account.address || !fundAmount) {
      toast.error("Invalid input", {
        description: "Please enter a valid amount",
      });
      return;
    }

    if (!universalBalance || universalBalance.value < parseUnits(fundAmount, 18)) {
      toast.error("Insufficient balance", {
        description: "Universal Account doesn't have enough ETH",
      });
      return;
    }

    try {
      sendTransaction({
        to: account.address,
        value: parseUnits(fundAmount, 18),
      });

      const toastId_ = toast("Transferring ETH...", {
        description: `Transferring ${fundAmount} ETH from Universal to Sub Account`,
        duration: Infinity,
      });

      setToastId(toastId_);
      setIsFundDialogOpen(false);
      setFundAmount("");
    } catch (_error) {
      toast.error("Transfer failed", {
        description: "Please try again",
      });
    }
  }, [universalAccount, account.address, fundAmount, universalBalance, sendTransaction]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between px-4 pb-4 md:pb-8 md:px-8">
      <div className="w-full max-w-2xl mx-auto">
        <nav className="flex justify-between items-center sticky top-0 bg-background z-10 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">🌍 World Builder</h1>
            <a
              href="https://github.com/stephancill/sub-accounts-fc-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Github
            </a>
          </div>
          {account.status === "connected" ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex flex-col items-end gap-0.5">
                <button
                  type="button"
                  className="text-xs text-muted-foreground cursor-pointer hover:opacity-80"
                  onClick={() => {
                    navigator.clipboard.writeText(universalAccount || "");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigator.clipboard.writeText(universalAccount || "");
                    }
                  }}
                  aria-label="Click to copy universal account address"
                  title="Click to copy universal account address"
                >
                  Universal: {universalAccount?.slice(0, 6)}...
                  {universalAccount?.slice(-4)}
                </button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-pointer hover:opacity-80">
                      ({universalBalance?.formatted.slice(0, 6)}{" "}
                      ETH)
                    </span>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send ETH</DialogTitle>
                      <DialogDescription>
                        Enter the recipient address and amount to send
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="text-sm text-muted-foreground">
                          Universal Account Balance
                        </div>
                        <div className="text-xl font-medium">
                          {universalBalance
                            ? `${universalBalance.formatted} ETH`
                            : "Loading..."}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {universalAccount?.slice(0, 10)}...
                          {universalAccount?.slice(-8)}
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={handleFundAccount}
                          disabled={
                            faucetMutation.isPending ||
                            !faucetEligibility.isEligible
                          }
                          className="h-auto p-0 text-xs mt-1"
                          title={
                            !faucetEligibility.isEligible
                              ? faucetEligibility.reason
                              : undefined
                          }
                        >
                          {faucetMutation.isPending
                            ? "Funding..."
                            : faucetEligibility.isEligible
                              ? "Get ETH on Base Sepolia"
                              : "Sufficient Balance"}
                        </Button>
                      </div>
                      <Input
                        placeholder="Recipient Address (0x...)"
                        value={toAddress}
                        onChange={(e) => setToAddress(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Amount in ETH"
                        step="0.001"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSend}
                        disabled={
                          !amount ||
                          !toAddress ||
                          isConfirming ||
                          isTransactionPending
                        }
                      >
                        Send ETH
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Button
                variant="default"
                onClick={handleFundAccount}
                size="sm"
              >
                Fund Account
              </Button>

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
  );
}

export default App;
