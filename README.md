# Sub Accounts Demo

A Next.js demo application showcasing how to integrate [Base Account Sub Accounts](https://docs.base.org/base-account/improve-ux/sub-accounts) with wagmi and the Base Account SDK.

## What are Sub Accounts?

Sub Accounts allow you to provision app-specific wallet accounts for your users that are embedded directly in your application. Once created, you can interact with them just as you would with any other wallet via wagmi, viem, or OnchainKit.

### Key Benefits

- **Frictionless transactions**: Eliminate repeated signing prompts for high-frequency and agentic use cases
- **No funding flows required**: Spend Permissions allow Sub Accounts to spend directly from the universal Base Account's balance
- **User control**: Users can manage all their sub accounts at [account.base.app](https://account.base.app)

## How This Demo Works

This project demonstrates Sub Accounts integration using wagmi's `baseAccount` connector, which provides a simpler alternative to directly using the Base Account SDK.

### Key Configuration

#### 1. Sub Account Configuration (`src/wagmi.ts`)

The core Sub Account setup happens in the wagmi config:

```typescript
import { baseAccount } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      baseAccount({
        appName: "Sub Accounts Demo",
        subAccounts: {
          creation: "on-connect",      // Automatically creates sub account when user connects
          defaultAccount: "sub",        // Uses sub account as default for transactions
        },
        paymasterUrls: {
          [baseSepolia.id]: process.env.NEXT_PUBLIC_PAYMASTER_SERVICE_URL,
        },
      }),
    ],
    // ... rest of config
  });
}
```

**Configuration explained:**
- `creation: "on-connect"` - Automatically creates a Sub Account for the user when they connect their Base Account
- `defaultAccount: "sub"` - Transactions will automatically be sent from the Sub Account unless you specify the `from` parameter to be the universal account address
- `paymasterUrls` - Optional paymaster configuration to sponsor gas fees for the best user experience

With this configuration:
1. User connects their wallet → Sub Account is automatically created
2. All transactions default to using the Sub Account
3. Spend Permissions are automatically requested as needed
4. Gas can be sponsored via paymaster (if configured)

#### 2. Base Account SDK Override (`package.json`)

This project uses pnpm overrides to ensure the latest Base Account SDK is used:

```json
{
  "pnpm": {
    "overrides": {
      "@base-org/account": "latest"
    }
  }
}
```

This override ensures that:
- The wagmi `baseAccount` connector uses the latest Base Account SDK features
- All dependencies (including wagmi itself) use the same version of `@base-org/account`
- You get the latest Sub Account functionality and bug fixes

<Note>
The `baseAccount` connector from wagmi internally uses the `@base-org/account` SDK. The override ensures version consistency across your dependency tree.
</Note>

## Auto Spend Permissions

This demo leverages **Auto Spend Permissions**, which is enabled by default when using Sub Accounts. This feature allows Sub Accounts to access funds from their parent Base Account when transaction balances are insufficient.

### How it works

**First-time transaction:**
When a Sub Account attempts its first transaction, Base Account:
- Automatically detects any missing tokens needed for the transaction
- Requests a transfer of required funds from the parent Base Account
- Allows the user to optionally grant ongoing spend permissions for future transactions

**Subsequent transactions:**
If spend permissions were granted, future transactions use existing Sub Account balances and granted permissions first, only prompting for additional authorization if needed.

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm installed
- A Coinbase Developer Platform account (for optional paymaster setup)

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env.local` file:

```bash
# Optional: Paymaster URL for gas sponsorship
NEXT_PUBLIC_PAYMASTER_SERVICE_URL=https://api.developer.coinbase.com/rpc/v1/base-sepolia/...
```

See [FAUCET_SETUP.md](./FAUCET_SETUP.md) for more details on setting up the paymaster.

### Run the Demo

```bash
# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

## Using Sub Accounts with wagmi

Once configured, you can use Sub Accounts with standard wagmi hooks:

### Get the Sub Account Address

```typescript
import { useAccount } from 'wagmi';

function MyComponent() {
  const { address } = useAccount();
  // `address` will be the sub account address (since defaultAccount: "sub")
  
  return <div>Sub Account: {address}</div>;
}
```

### Send Transactions

Transactions automatically use the Sub Account:

```typescript
import { useSendTransaction } from 'wagmi';

function SendButton() {
  const { sendTransaction } = useSendTransaction();
  
  const handleSend = () => {
    sendTransaction({
      to: '0x...',
      value: parseEther('0.01'),
      // Automatically sent from sub account
    });
  };
  
  return <button onClick={handleSend}>Send Transaction</button>;
}
```

### Access the Universal Account

If you need to access the universal (parent) account:

```typescript
import { useAccount, useConnections } from 'wagmi';

function MyComponent() {
  const { address: subAddress } = useAccount();
  const connections = useConnections();
  
  // The connector exposes additional account info
  const connector = connections[0]?.connector;
  const universalAddress = connector?.accounts?.[0]; // Parent account
  
  return (
    <div>
      <div>Universal Account: {universalAddress}</div>
      <div>Sub Account: {subAddress}</div>
    </div>
  );
}
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── faucet/         # Backend faucet endpoint
│   │   └── posts/          # Example API route
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Main demo page
├── components/
│   ├── posts.tsx           # Example component showing transactions
│   └── ui/                 # UI components (buttons, dialogs, etc.)
├── hooks/
│   ├── useFaucet.ts        # Hook for requesting test tokens
│   └── useFaucetEligibility.ts
├── lib/
│   ├── faucet.ts           # Faucet utilities
│   ├── usdc.ts             # USDC contract utilities
│   └── utils.ts            # General utilities
└── wagmi.ts                # ⭐ Wagmi configuration with Sub Accounts
```

## Technical Details

### How Sub Accounts Work

Base Account's self-custodial design requires a user passkey prompt for each wallet interaction. Sub Accounts provide a solution for applications requiring frequent wallet interactions by:

1. Creating a hierarchical relationship between the universal Base Account and app-specific Sub Accounts
2. Using browser CryptoKey APIs to generate non-extractable signing keys
3. Linking Sub Accounts onchain through [ERC-7895](https://eip.tools/eip/7895) wallet RPC methods
4. Combining with [Spend Permissions](https://docs.base.org/base-account/improve-ux/spend-permissions) to enable seamless funding

### wagmi vs Direct SDK Usage

This demo uses wagmi's `baseAccount` connector, which provides:
- ✅ Simpler configuration
- ✅ Standard wagmi hooks (useAccount, useSendTransaction, etc.)
- ✅ Automatic Sub Account management
- ✅ Better TypeScript integration

For more control, you can use the Base Account SDK directly. See the [Complete Integration Example](https://docs.base.org/base-account/improve-ux/sub-accounts#complete-integration-example) in the docs.

## Additional Resources

- **Official Documentation**: [Base Account Sub Accounts](https://docs.base.org/base-account/improve-ux/sub-accounts)
- **Live Demo**: [sub-accounts-fc.vercel.app](https://sub-accounts-fc.vercel.app)
- **wagmi Docs**: [wagmi.sh](https://wagmi.sh)
- **Base Account Dashboard**: [account.base.app](https://account.base.app)
- **Spend Permissions Guide**: [Base Account Spend Permissions](https://docs.base.org/base-account/improve-ux/spend-permissions)
- **Paymaster Guide**: [Coinbase Paymaster](https://docs.cdp.coinbase.com/paymaster/introduction/welcome)

## Best Practices

1. **Use Paymasters**: Sponsor gas fees to provide the smoothest user experience
2. **Handle Ownership Updates**: Sub Accounts may need ownership updates when users switch devices - the SDK handles this automatically
3. **Customize App Metadata**: Set meaningful `appName` values to help users identify your app in their Base Account dashboard
4. **Test Thoroughly**: Use Base Sepolia testnet before deploying to production

## Support

For questions or issues:
- Check the [Base Account documentation](https://docs.base.org/base-account)
- Join the [Base Discord](https://discord.gg/buildonbase)
- Open an issue in this repository

## License

MIT
#   B B Q 1 1  
 