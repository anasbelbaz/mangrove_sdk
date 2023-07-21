import "./App.css";
import {
    EthereumClient,
    w3mConnectors,
    w3mProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { polygonMumbai, localhost } from "wagmi/chains";
import { Home } from "./pages";
import MangroveProvider from "./contexts/mangrove";

/**
 * Wallet connect
 */
const chains = [polygonMumbai, localhost];
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;
if (!projectId) {
    throw new Error("VITE_WALLET_CONNECT_PROJECT_ID env is required");
}

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, chains }),
    publicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);

function App() {
    return (
        <WagmiConfig config={wagmiConfig}>
            <Web3Modal
                projectId={projectId as string}
                ethereumClient={ethereumClient}
            />
            <MangroveProvider>
                <Home />
            </MangroveProvider>
        </WagmiConfig>
    );
}

export default App;
