import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [base], // Only Base Mainnet
    connectors: [
      baseAccount({
        appName: "World Builder",
        subAccounts: {
          creation: "on-connect",
          defaultAccount: "sub",
        },
        paymasterUrls: {
          [base.id]: "https://api.developer.coinbase.com/rpc/v1/base/oMc2GB9cTF7I8zaD11NHTuIVDxECmWz1",
        },
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
