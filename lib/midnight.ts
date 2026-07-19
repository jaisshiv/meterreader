export const DEFAULT_NETWORK = "preprod";

export type PartyRole = "organizer" | "guest";

export interface WalletConnection {
  address: string;
  network: string;
  connected: boolean;
}

export async function connectWallet(role: PartyRole): Promise<WalletConnection> {
  if (typeof window === "undefined") {
    return {
      address: `${role}-wallet-address`,
      network: DEFAULT_NETWORK,
      connected: false,
    };
  }

  const existing = window.localStorage.getItem("private-party-wallet");
  if (existing) {
    const parsed = JSON.parse(existing) as WalletConnection;
    return parsed;
  }

  const fallback: WalletConnection = {
    address: `${role}-wallet-address`,
    network: DEFAULT_NETWORK,
    connected: true,
  };

  window.localStorage.setItem("private-party-wallet", JSON.stringify(fallback));
  return fallback;
}

export function getWalletHint(): string {
  return "Install the 1AM wallet and switch it to the preprod network to connect for live Midnight transactions.";
}
