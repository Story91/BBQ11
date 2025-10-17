"use client";

import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, useConnections, useSendCalls, useSwitchChain } from "wagmi";
import { parseUnits, formatUnits, encodeFunctionData } from "viem";
import { base } from "viem/chains";
// Removed USDC imports - now using ETH
import { 
  Map as MapIcon, 
  Mountain, 
  DollarSign, 
  Trophy, 
  Users,
  Plus,
  Info
} from "lucide-react";
import SubAccountManager from "./SubAccountManager";
import AnimatedTile from "./animations/AnimatedTile";
import SplitText from "./animations/SplitText";
import LoadingAnimation from "./animations/LoadingAnimation";
import AnimatedButton, { RippleButton } from "./animations/AnimatedButton";

interface Tile {
  id: string;
  x: number;
  y: number;
  owner: string | null;
  building: 'empty' | 'house' | 'shop' | 'attraction';
  income: number;
  lastHarvest: number;
}

interface PlayerStats {
  totalLand: number;
  totalEarnings: number;
  rank: number;
}

const WORLD_SIZE = 20;
const TILE_SIZE = 50;
const LAND_PRICE = 0.000001; // 0.000001 ETH (1 gwei)
const BUILDING_PRICES = {
  house: 0.005, // 0.005 ETH
  shop: 0.02,   // 0.02 ETH  
  attraction: 0.05 // 0.05 ETH
};
const BUILDING_INCOME = {
  house: 0.01,
  shop: 0.03,
  attraction: 0.1
};

export default function WorldBuilder() {
  const account = useAccount();
  const connections = useConnections();
  const { switchChain } = useSwitchChain();
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [showSubAccountBalance, setShowSubAccountBalance] = useState(true);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalLand: 0,
    totalEarnings: 0,
    rank: 1
  });

  // Get both Sub Account and Universal Account
  const [_subAccount, universalAccount] = connections.flatMap((connection) => connection.accounts);
  
  // Check ETH balances
  const { data: subAccountBalance } = useBalance({
    address: account.address,
  });
  
  const { data: universalBalance } = useBalance({
    address: universalAccount,
    query: { enabled: !!universalAccount },
  });
  
  // Use the balance based on toggle selection
  const balance = showSubAccountBalance ? subAccountBalance : universalBalance;

  // Transaction handling
  const { sendTransaction, data: hash, isPending, reset } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Use wallet_sendCalls for Base Account Spend Permissions (per Base docs)
  const sendCalls = useCallback(async (calls: any[], from?: string) => {
    if (!account.address) return;
    
    const provider = (window as any).ethereum;
    if (!provider) return;

    try {
      const callsId = await provider.request({
        method: 'wallet_sendCalls',
        params: [{
          version: "2.0",
          atomicRequired: true,
           chainId: `0x${base.id.toString(16)}`, // Convert to hex as per docs
          from: from || account.address,
          calls: calls,
          capabilities: {
            // Add paymaster if available
            ...(process.env.NEXT_PUBLIC_PAYMASTER_SERVICE_URL && {
              paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_SERVICE_URL
            })
          },
        }],
      });
      
      console.log('wallet_sendCalls successful:', callsId);
      return callsId;
    } catch (error) {
      console.error('wallet_sendCalls failed:', error);
      throw error;
    }
  }, [account.address]);

  // Get the spender contract address from Spend Permissions
  const getSpenderContract = useCallback(async () => {
    if (!universalAccount) return null;
    
    const provider = (window as any).ethereum;
    if (!provider) return null;

    try {
      // Try to get the spender contract from Spend Permissions
      const response = await provider.request({
        method: 'wallet_getSubAccounts',
        params: [{
          account: universalAccount,
          domain: window.location.origin,
        }]
      });
      
      // The spender contract should be available in the response
      // This is a simplified approach - in real implementation you'd need to parse the Spend Permissions
      console.log('Spend Permissions response:', response);
      
      // For now, return the Sub Account as spender (this may need adjustment)
      return account.address;
    } catch (error) {
      console.error('Failed to get spender contract:', error);
      return account.address; // Fallback to Sub Account
    }
  }, [universalAccount, account.address]);

  // Generate world tiles (deterministic for SSR)
  const [worldTiles, setWorldTiles] = useState<Tile[]>([]);
  
  useEffect(() => {
    const tiles: Tile[] = [];
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let y = 0; y < WORLD_SIZE; y++) {
        // Use deterministic "randomness" based on coordinates
        const seed = x * WORLD_SIZE + y;
        const isOwned = (seed * 7) % 10 === 0; // 10% owned
        const hasBuilding = (seed * 3) % 20 === 0; // 5% with buildings
        
        tiles.push({
          id: `${x}-${y}`,
          x,
          y,
          owner: isOwned ? `0x${seed.toString(16).padStart(40, '0')}` : null,
          building: hasBuilding ? 'house' : 'empty',
          income: 0,
          lastHarvest: Date.now()
        });
      }
    }
    setWorldTiles(tiles);
  }, []);

  const handleTileClick = useCallback((tile: Tile) => {
    setSelectedTile(tile);
  }, []);

  const handlePurchaseLand = useCallback(async () => {
    if (!selectedTile || !account.address) return;
    
    if (selectedTile.owner) {
      toast.error("Land already owned", {
        description: "This land is already owned by another player",
      });
      return;
    }

    if (!balance || balance.value < parseUnits(LAND_PRICE.toString(), 18)) { // ETH has 18 decimals
      toast.error("Insufficient balance", {
        description: `You need at least ${LAND_PRICE} ETH to purchase land`,
      });
      return;
    }

    try {
      setIsBuilding(true);
      
      // Create a mock transaction for land purchase
      // In a real app, this would interact with a smart contract
      const mockRecipient = "0xF1fa20027b6202bc18e4454149C85CB01dC91Dfd"; // Real address as requested
      
      // Direct ETH transfer (simpler than ERC-20)
      const ethAmount = parseUnits("0.000001", 18); // 0.000001 ETH
      
      console.log("Using ETH transfer...");

      console.log("Purchasing land:", {
        tile: selectedTile.id,
        price: LAND_PRICE,
        recipient: mockRecipient,
        from: universalAccount, // Try to send from Universal Account
        subAccount: account.address
      });

      console.log("=== LAND PURCHASE DEBUG ===");
      console.log("Sub Account:", account.address);
      console.log("Universal Account:", universalAccount);
      console.log("Sub Account Balance:", subAccountBalance?.formatted);
      console.log("Universal Account Balance:", universalBalance?.formatted);
      console.log("Using Balance:", balance?.formatted);
      console.log("Recipient:", mockRecipient);
       console.log("Amount:", "0.000001 ETH");
      console.log("ETH Amount:", ethAmount);
      console.log("Chain ID:", account.chainId);
      console.log("Wallet Connector:", account.connector?.name);
      console.log("========================");

      // Use sendTransaction - it should automatically handle Spend Permissions
      console.log("Using sendTransaction with Auto Spend Permissions...");
      console.log("Sub Account balance:", subAccountBalance?.formatted);
      console.log("Universal Account balance:", universalBalance?.formatted);
      console.log("Transaction amount:", formatUnits(ethAmount, 18), "ETH");
      
       // Spend Permissions will be handled automatically by Base Account
       console.log("Spend Permissions will be handled automatically by Base Account...");
       
       // sendTransaction should automatically use Spend Permissions if Sub Account has insufficient funds
       sendTransaction({
         to: mockRecipient,
         value: ethAmount,
         // Will automatically use Spend Permissions if Sub Account balance is insufficient
       });
      
      toast("Purchasing land...", {
        description: `Buying tile (${selectedTile.x}, ${selectedTile.y}) for 0.000001 ETH`,
        duration: Infinity,
      });

    } catch (error) {
      console.error("Error purchasing land:", error);
      toast.error("Failed to purchase land", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      setIsBuilding(false);
    }
  }, [selectedTile, account.address, balance, sendTransaction]);

  const handleBuild = useCallback(async (buildingType: 'house' | 'shop' | 'attraction') => {
    if (!selectedTile || !account.address) return;
    
    if (!selectedTile.owner || selectedTile.owner !== account.address) {
      toast.error("Not your land", {
        description: "You can only build on land you own",
      });
      return;
    }

    if (selectedTile.building !== 'empty') {
      toast.error("Land occupied", {
        description: "This land already has a building",
      });
      return;
    }

    const price = BUILDING_PRICES[buildingType];
    if (!balance || balance.value < parseUnits(price.toString(), 18)) { // ETH has 18 decimals
      toast.error("Insufficient balance", {
        description: `You need at least ${price} ETH to build a ${buildingType}`,
      });
      return;
    }

    try {
      setIsBuilding(true);
      
      // Create a mock transaction for building
      const mockRecipient = "0xF1fa20027b6202bc18e4454149C85CB01dC91Dfd"; // Use same recipient as land purchase
      
      const ethAmount = parseUnits(price.toString(), 18); // ETH has 18 decimals

      console.log("Building:", {
        tile: selectedTile.id,
        building: buildingType,
        price: price
      });

      sendTransaction({
        to: mockRecipient,
        value: ethAmount,
      });

      toast(`Building ${buildingType}...`, {
        description: `Constructing ${buildingType} on tile (${selectedTile.x}, ${selectedTile.y}) for ${price} ETH`,
        duration: Infinity,
      });

    } catch (error) {
      console.error("Error building:", error);
      toast.error("Failed to build", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      setIsBuilding(false);
    }
  }, [selectedTile, account.address, balance, sendTransaction]);

  // Handle transaction success and errors
  useEffect(() => {
    if (isConfirmed && selectedTile) {
      toast.success("Transaction successful!", {
        description: selectedTile.owner ? "Building constructed!" : "Land purchased!",
      });

      // Update the tile
      setWorldTiles(prev => prev.map(tile => 
        tile.id === selectedTile.id 
          ? {
              ...tile,
              owner: tile.owner || account.address || null,
              building: tile.owner ? (selectedTile.building || 'house') : tile.building
            }
          : tile
      ));

      // Update player stats
      setPlayerStats(prev => ({
        ...prev,
        totalLand: prev.totalLand + (selectedTile.owner ? 0 : 1)
      }));

      setSelectedTile(null);
      setIsBuilding(false);
      reset();
    }
  }, [isConfirmed, selectedTile, account.address, reset]);

  // Handle transaction errors
  useEffect(() => {
    if (hash && !isPending && !isConfirming && !isConfirmed) {
      // Transaction failed
      toast.error("Transaction failed", {
        description: "The transaction was rejected or failed. Check console for details.",
      });
      setIsBuilding(false);
      setSelectedTile(null);
      reset();
    }
  }, [hash, isPending, isConfirming, isConfirmed, reset]);

  const getTileColor = (tile: Tile) => {
    if (!tile.owner) return '#f3f4f6'; // Gray for unowned
    if (tile.owner === account.address) return '#10b981'; // Green for owned by user
    return '#f59e0b'; // Orange for owned by others
  };

  const getBuildingIcon = (building: string) => {
    switch (building) {
      case 'house': return <Mountain className="w-3 h-3" />;
      case 'shop': return <Mountain className="w-3 h-3" />;
      case 'attraction': return <Mountain className="w-3 h-3" />;
      default: return null;
    }
  };

  if (!account.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 bg-card/50 backdrop-blur-sm rounded-lg border border-white/10 p-8">
        <MapIcon className="w-16 h-16 text-muted-foreground" />
        <SplitText 
          text="Welcome to World Builder" 
          animationType="fadeUp"
          className="text-2xl font-bold text-center"
          delay={0.3}
        />
        <SplitText 
          text="Connect your wallet to start building your virtual world. Buy land, construct buildings, and earn income from tourists!" 
          animationType="fadeUp"
          className="text-muted-foreground text-center max-w-md"
          delay={0.6}
          stagger={0.05}
        />
      </div>
    );
  }

  if (worldTiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 bg-card/50 backdrop-blur-sm rounded-lg border border-white/10 p-8">
        <LoadingAnimation size={80} color="#3b82f6" />
        <SplitText 
          text="Loading World..." 
          animationType="scale"
          className="text-2xl font-bold"
          delay={0.2}
        />
        <SplitText 
          text="Generating your virtual world" 
          animationType="fadeUp"
          className="text-muted-foreground"
          delay={0.5}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        {/* Stats and Balance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-card/90 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <MapIcon className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">Land Owned</span>
            </div>
            <div className="text-2xl font-bold">{playerStats.totalLand}</div>
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-card/90 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium">Rank</span>
            </div>
            <div className="text-2xl font-bold">#{playerStats.rank}</div>
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-card/90 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Your Balance</div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${showSubAccountBalance ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-muted-foreground'}`}>
                  Sub
                </span>
                <button
                  onClick={() => setShowSubAccountBalance(!showSubAccountBalance)}
                  className="relative inline-flex h-3 w-5 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <span
                    className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${
                      showSubAccountBalance ? 'translate-x-2.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className={`text-xs px-1.5 py-0.5 rounded ${!showSubAccountBalance ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'text-muted-foreground'}`}>
                  Base
                </span>
                {showSubAccountBalance && (
                  <SubAccountManager>
                    <button className="ml-2 px-2 py-0.5 text-xs rounded bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black transition-colors font-medium">
                      FUND
                    </button>
                  </SubAccountManager>
                )}
              </div>
            </div>
            <div className="text-2xl font-bold">
              {balance ? `${balance.formatted} ETH` : "Loading..."}
            </div>
            <div className="text-xs text-muted-foreground">
              {showSubAccountBalance ? (
                account.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "Sub Account"
              ) : (
                universalAccount ? `${universalAccount.slice(0, 6)}...${universalAccount.slice(-4)}` : "Base Account"
              )}
            </div>
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-card/90 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Total Earnings</span>
            </div>
            <div className="text-2xl font-bold">{playerStats.totalEarnings.toFixed(4)} ETH</div>
          </div>
        </div>
      </div>

      {/* Selected Tile Info - Always Visible */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Selected Tile
            </h3>
            <p className="text-sm text-muted-foreground">Choose your next land purchase</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Land Price</div>
            <div className="text-lg font-bold text-emerald-600">{LAND_PRICE} ETH</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-sm text-muted-foreground mb-1">Coordinates</div>
            <div className="font-mono text-lg font-bold">
              {selectedTile ? `(${selectedTile.x}, ${selectedTile.y})` : "(0, 0)"}
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-sm text-muted-foreground mb-1">Status</div>
            <div className="font-medium">
              {selectedTile ? (
                selectedTile.owner ? 
                  (selectedTile.owner === account.address ? "Your land" : "Owned by others") : 
                  "Available for purchase"
              ) : "No tile selected"}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-lg p-4 border border-emerald-500/30">
            <div className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">Quick Action</div>
            <RippleButton 
              onClick={handlePurchaseLand}
              disabled={isBuilding || isPending || isConfirming || !selectedTile || selectedTile?.owner}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              animationType="glow"
            >
              {isBuilding ? "Purchasing..." : "Buy Land"}
            </RippleButton>
          </div>
        </div>
        
        {selectedTile && selectedTile.owner && selectedTile.owner === account.address && (
          <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Info className="w-4 h-4" />
              <span className="font-medium">This is your land!</span>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
              You can build structures here to generate income.
            </div>
          </div>
        )}
      </div>

      {/* World Map */}
      <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/30 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MapIcon className="w-4 h-4 text-white" />
            </div>
            <SplitText 
              text="World Map" 
              animationType="fadeUp"
              className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              delay={0.1}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-white/80">Available</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-white/80">Your Land</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <span className="text-white/80">Others</span>
            </div>
          </div>
        </div>
        
        <div className="w-full overflow-hidden border border-white/20 rounded-xl bg-gradient-to-br from-gray-900/50 to-blue-900/30 backdrop-blur-sm p-6">
          <div 
            className="grid gap-1 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${WORLD_SIZE}, ${TILE_SIZE}px)`,
              width: 'fit-content',
              maxWidth: '100%'
            }}
          >
            {worldTiles.map((tile) => (
              <AnimatedTile
                key={tile.id}
                tile={tile}
                isSelected={selectedTile?.id === tile.id}
                onClick={() => handleTileClick(tile)}
                accountAddress={account.address}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action Panel */}
      {selectedTile && (
        <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Tile Actions</h3>
          </div>
          
          {selectedTile.owner === account.address ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Info className="w-4 h-4" />
                <span className="font-medium">This is your land - Build something!</span>
              </div>
              
              {selectedTile.building === 'empty' ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Available Buildings:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AnimatedButton 
                      variant="outline" 
                      onClick={() => handleBuild('house')}
                      disabled={isBuilding || isPending || isConfirming}
                      className="flex flex-col items-center gap-3 h-auto p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-500/30"
                      animationType="bounce"
                      hoverEffect={true}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Mountain className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-semibold">House</span>
                      <span className="text-sm text-muted-foreground">{BUILDING_PRICES.house} ETH</span>
                    </AnimatedButton>
                    
                    <AnimatedButton 
                      variant="outline" 
                      onClick={() => handleBuild('shop')}
                      disabled={isBuilding || isPending || isConfirming}
                      className="flex flex-col items-center gap-3 h-auto p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border-green-500/30"
                      animationType="pulse"
                      hoverEffect={true}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Mountain className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-semibold">Shop</span>
                      <span className="text-sm text-muted-foreground">{BUILDING_PRICES.shop} ETH</span>
                    </AnimatedButton>
                    
                    <AnimatedButton 
                      variant="outline" 
                      onClick={() => handleBuild('attraction')}
                      disabled={isBuilding || isPending || isConfirming}
                      className="flex flex-col items-center gap-3 h-auto p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-500/30"
                      animationType="glow"
                      hoverEffect={true}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Mountain className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-semibold">Attraction</span>
                      <span className="text-sm text-muted-foreground">{BUILDING_PRICES.attraction} ETH</span>
                    </AnimatedButton>
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                    <Mountain className="w-5 h-5" />
                    <span className="font-semibold">Building: {selectedTile.building}</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Income: {BUILDING_INCOME[selectedTile.building]} ETH/day
                  </div>
                </div>
              )}
            </div>
          ) : selectedTile.owner ? (
            <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <Info className="w-4 h-4" />
                <span className="font-medium">This land is owned by another player</span>
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Select an available tile to purchase.
              </div>
            </div>
          ) : (
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4" />
                <span className="font-medium">Available for purchase!</span>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Use the "Buy Land" button above to purchase this tile.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
