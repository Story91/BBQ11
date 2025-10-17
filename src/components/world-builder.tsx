"use client";

import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, useConnections, useSendCalls, useSwitchChain } from "wagmi";
import { parseUnits, formatUnits, encodeFunctionData } from "viem";
import { base } from "viem/chains";
// Removed USDC imports - now using ETH
import { 
  Map, 
  Home, 
  Store, 
  Mountain, 
  DollarSign, 
  Trophy, 
  Users,
  Plus,
  Info
} from "lucide-react";

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
  totalBuildings: number;
  dailyIncome: number;
  totalEarnings: number;
  rank: number;
}

const WORLD_SIZE = 20;
const TILE_SIZE = 40;
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
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalLand: 0,
    totalBuildings: 0,
    dailyIncome: 0,
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
  
  // Use the balance that has funds
  const balance = subAccountBalance?.value && subAccountBalance.value > 0n 
    ? subAccountBalance 
    : universalBalance;

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
      
       // Check Spend Permissions status before transaction
       console.log("Checking Spend Permissions status...");
       
       // Try to get Spend Permissions info
       try {
         const provider = (window as any).ethereum;
         if (provider) {
           const permissions = await provider.request({
             method: 'wallet_getPermissions',
             params: []
           });
           console.log("Current permissions:", permissions);
         }
       } catch (error) {
         console.log("Could not fetch permissions:", error);
       }
       
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
        totalLand: prev.totalLand + (selectedTile.owner ? 0 : 1),
        totalBuildings: prev.totalBuildings + (selectedTile.owner ? 1 : 0)
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
      case 'house': return <Home className="w-3 h-3" />;
      case 'shop': return <Store className="w-3 h-3" />;
      case 'attraction': return <Mountain className="w-3 h-3" />;
      default: return null;
    }
  };

  if (!account.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Map className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Welcome to World Builder</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Connect your wallet to start building your virtual world. 
          Buy land, construct buildings, and earn income from tourists!
        </p>
      </div>
    );
  }

  if (worldTiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Map className="w-16 h-16 text-muted-foreground animate-pulse" />
        <h2 className="text-2xl font-bold">Loading World...</h2>
        <p className="text-muted-foreground">Generating your virtual world</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Land Owned</span>
          </div>
          <div className="text-2xl font-bold">{playerStats.totalLand}</div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Buildings</span>
          </div>
          <div className="text-2xl font-bold">{playerStats.totalBuildings}</div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Daily Income</span>
          </div>
          <div className="text-2xl font-bold">${playerStats.dailyIncome.toFixed(2)}</div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium">Rank</span>
          </div>
          <div className="text-2xl font-bold">#{playerStats.rank}</div>
        </div>
      </div>

      {/* Balance and Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Your Balance</div>
          <div className="text-xl font-bold">
            {balance ? `${balance.formatted} ETH` : "Loading..."}
          </div>
        </div>
        
        {selectedTile && (
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-sm text-muted-foreground">Selected Tile</div>
            <div className="font-medium">({selectedTile.x}, {selectedTile.y})</div>
            <div className="text-xs text-muted-foreground">
              {selectedTile.owner ? 
                (selectedTile.owner === account.address ? "Your land" : "Owned by others") : 
                "Available for purchase"
              }
            </div>
          </div>
        )}
      </div>

      {/* World Map */}
      <div className="bg-card p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">World Map</h3>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Your Land</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Others</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-auto max-h-96 border rounded-lg bg-gray-50 p-4">
          <div 
            className="grid gap-1 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${WORLD_SIZE}, ${TILE_SIZE}px)`,
              width: `${WORLD_SIZE * (TILE_SIZE + 4)}px`
            }}
          >
            {worldTiles.map((tile) => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                className={`
                  w-10 h-10 border rounded flex items-center justify-center text-xs
                  hover:ring-2 hover:ring-blue-500 transition-all
                  ${selectedTile?.id === tile.id ? 'ring-2 ring-blue-500' : ''}
                `}
                style={{ backgroundColor: getTileColor(tile) }}
                title={`Tile (${tile.x}, ${tile.y}) - ${tile.owner ? 'Owned' : 'Available'}`}
              >
                {getBuildingIcon(tile.building)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Panel */}
      {selectedTile && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Tile Actions</h3>
          
          {!selectedTile.owner ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="text-sm">This land is available for purchase</span>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <strong>Account Status:</strong>
                </div>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Sub Account: {account.address?.slice(0, 6)}...{account.address?.slice(-4)} ({subAccountBalance?.formatted || "0"} ETH)</li>
                  <li>• Universal Account: {universalAccount?.slice(0, 6)}...{universalAccount?.slice(-4)} ({universalBalance?.formatted || "0"} ETH)</li>
                   <li>• {subAccountBalance?.value === 0n ? "Will use Universal Account funds via Spend Permissions" : "Using Sub Account funds"}</li>
                   <li>• Current Chain ID: {account.chainId} ({account.chainId === 8453 ? "Base Mainnet ✅" : "Base Sepolia ❌"})</li>
                   <li>• ⚠️ Spend Permissions may expire after first transaction</li>
                   <li>• Check console for permission status before each transaction</li>
                </ul>
              </div>
              
              {account.chainId !== 8453 && (
                <Button 
                  onClick={() => switchChain({ chainId: 8453 })}
                  variant="outline"
                  className="w-full mb-2"
                >
                  Switch to Base Mainnet (8453)
                </Button>
              )}
              
              <Button 
                onClick={handlePurchaseLand}
                disabled={isBuilding || isPending || isConfirming}
                className="w-full"
              >
                 {isBuilding ? "Purchasing..." : `Buy Land for 0.000001 ETH`}
              </Button>
            </div>
          ) : selectedTile.owner === account.address ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-green-500" />
                <span className="text-sm">This is your land</span>
              </div>
              
              {selectedTile.building === 'empty' ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Build something:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => handleBuild('house')}
                      disabled={isBuilding || isPending || isConfirming}
                      className="flex flex-col items-center gap-2 h-auto p-4"
                    >
                      <Home className="w-5 h-5" />
                      <span>House</span>
                      <span className="text-xs text-muted-foreground">${BUILDING_PRICES.house}</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => handleBuild('shop')}
                      disabled={isBuilding || isPending || isConfirming}
                      className="flex flex-col items-center gap-2 h-auto p-4"
                    >
                      <Store className="w-5 h-5" />
                      <span>Shop</span>
                      <span className="text-xs text-muted-foreground">${BUILDING_PRICES.shop}</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => handleBuild('attraction')}
                      disabled={isBuilding || isPending || isConfirming}
                      className="flex flex-col items-center gap-2 h-auto p-4"
                    >
                      <Mountain className="w-5 h-5" />
                      <span>Attraction</span>
                      <span className="text-xs text-muted-foreground">${BUILDING_PRICES.attraction}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Building: {selectedTile.building}</span>
                  <span className="text-xs text-muted-foreground">
                    Income: ${BUILDING_INCOME[selectedTile.building]}/day
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-500" />
              <span className="text-sm">This land is owned by another player</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
