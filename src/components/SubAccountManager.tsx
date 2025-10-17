"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAccount, useBalance, useSendTransaction, useConnections } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Copy, Wallet, ArrowRight, ExternalLink } from "lucide-react";
import AnimatedButton from "./animations/AnimatedButton";

interface SubAccountManagerProps {
  children?: React.ReactNode;
}

export default function SubAccountManager({ children }: SubAccountManagerProps) {
  const account = useAccount();
  const connections = useConnections();
  const [isOpen, setIsOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Get both Sub Account and Universal Account
  const [_subAccount, universalAccount] = connections.flatMap((connection) => connection.accounts);

  // Check ETH balances
  const { data: subAccountBalance, refetch: refetchSubBalance } = useBalance({
    address: account.address,
    query: { refetchInterval: 2000 },
  });

  const { data: universalBalance, refetch: refetchUniversalBalance } = useBalance({
    address: universalAccount,
    query: { 
      enabled: !!universalAccount,
      refetchInterval: 2000,
    },
  });

  // Transaction handling
  const { sendTransaction, isPending } = useSendTransaction();

  // Copy address to clipboard
  const copyToClipboard = useCallback(async (address: string, label: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(`${label} address copied!`, {
        description: `${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error) {
      toast.error("Failed to copy address");
    }
  }, []);

  // Transfer ETH from Universal to Sub Account
  const handleTransfer = useCallback(async () => {
    if (!transferAmount || !account.address || !universalAccount) {
      toast.error("Missing required information");
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amountWei = parseUnits(transferAmount, 18);
    
    if (!universalBalance || universalBalance.value < amountWei) {
      toast.error("Insufficient balance in Universal Account");
      return;
    }

    setIsTransferring(true);

    try {
      await sendTransaction({
        to: account.address, // Send to Sub Account
        value: amountWei,
        // This will be sent from Universal Account due to wagmi configuration
      });

      toast.success("Transfer initiated!", {
        description: `Sending ${transferAmount} ETH to Sub Account`,
      });

      // Refetch balances after a delay
      setTimeout(() => {
        refetchSubBalance();
        refetchUniversalBalance();
      }, 3000);

      setTransferAmount("");
    } catch (error) {
      console.error("Transfer failed:", error);
      toast.error("Transfer failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTransferring(false);
    }
  }, [transferAmount, account.address, universalAccount, universalBalance, sendTransaction, refetchSubBalance, refetchUniversalBalance]);

  if (!account.isConnected) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Wallet className="h-4 w-4" />
            Account Manager
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Sub Account Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Universal Account */}
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm text-muted-foreground">Base Account</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => universalAccount && copyToClipboard(universalAccount, "Base")}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="font-mono text-sm mb-1">
              {universalAccount ? `${universalAccount.slice(0, 6)}...${universalAccount.slice(-4)}` : "Not connected"}
            </div>
            <div className="text-lg font-bold">
              {universalBalance ? `${universalBalance.formatted} ETH` : "Loading..."}
            </div>
            {universalAccount && (
              <a
                href={`https://basescan.org/address/${universalAccount}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                View on BaseScan
              </a>
            )}
          </div>

          {/* Sub Account */}
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm text-muted-foreground">Sub Account</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => account.address && copyToClipboard(account.address, "Sub")}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="font-mono text-sm mb-1">
              {account.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "Not connected"}
            </div>
            <div className="text-lg font-bold">
              {subAccountBalance ? `${subAccountBalance.formatted} ETH` : "Loading..."}
            </div>
            {account.address && (
              <a
                href={`https://basescan.org/address/${account.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                View on BaseScan
              </a>
            )}
          </div>

          {/* Transfer Section */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Transfer to Sub Account
            </h3>
            <div className="space-y-3">
              <div>
                <Input
                  type="number"
                  placeholder="0.001"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  step="0.000001"
                  min="0"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Available: {universalBalance ? `${universalBalance.formatted} ETH` : "Loading..."}
                </div>
              </div>
              <AnimatedButton
                onClick={handleTransfer}
                disabled={!transferAmount || isTransferring || isPending}
                className="w-full"
                variant="default"
              >
                {isTransferring || isPending ? (
                  "Funding..."
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Fund Sub Account
                  </>
                )}
              </AnimatedButton>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <strong>💡 Tip:</strong> Sub Accounts automatically use Spend Permissions to access Base Account funds when needed. Manual transfers are optional for pre-funding.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
