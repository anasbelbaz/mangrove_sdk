import React from "react";
// hooks
import { useEthersSigner } from "../hooks/adapter";
// mangrove
import { Mangrove } from "@mangrovedao/mangrove.js";
// wagmi
import {
    erc20ABI,
    useAccount,
    useContractRead,
    useNetwork,
    useSwitchNetwork,
} from "wagmi";
// types
import { Pair } from "../types";
// utils
import tokenList from "../utils/tokens/mangrove-tokens.json";
import erc20_abi from "../utils/tokens/abi.json";
import { formatUnits } from "viem";
import { polygonMumbai } from "wagmi/chains";

type ContextValues = {
    mangrove: Mangrove | undefined;
    pair: Pair;
    checkMarket: () => void;
    setPair: (pair: Pair) => void;
    decimals: number;
    balance: number;
};

const defaultValues: ContextValues = {
    mangrove: undefined,
    pair: { base: "WETH", quote: "USDC" },
    decimals: 0,
    balance: 0,
    checkMarket: () => null,
    setPair: () => null,
};

const MangroveContext = React.createContext(defaultValues);
export const useMangrove = () => React.useContext(MangroveContext);

const MangroveProvider = ({ children }: React.PropsWithChildren) => {
    const { isConnected, address } = useAccount();
    const { chain } = useNetwork();
    const { switchNetwork } = useSwitchNetwork();

    const [mangrove, setMangrove] = React.useState<Mangrove | undefined>();
    const [pair, setPair] = React.useState<Pair>({
        base: "USDC",
        quote: "USDT",
    });

    const tokenAddress = React.useMemo(() => {
        return tokenList.find((token) => token.symbol === pair.base)?.address;
    }, [pair]);

    const { data: decimals } = useContractRead({
        address: tokenAddress as `0x`,
        abi: erc20ABI,
        functionName: "decimals",
    });

    const { data: balance } = useContractRead({
        address: tokenAddress as `0x`,
        abi: erc20_abi,
        functionName: "balanceOf",
        args: [address],
        enabled: !!address,
    });

    const signer = useEthersSigner();

    const initMangrove = async () => {
        try {
            if (chain && chain.id != polygonMumbai.id) {
                switchNetwork?.(polygonMumbai.id);
                return;
            }
            const mgv = await Mangrove.connect({
                signer,
                provider: signer?.provider,
            });

            setMangrove(mgv);
        } catch (error) {
            console.log(error);
        }
    };

    const checkMarket = async () => {
        try {
            if (!mangrove) throw new Error("Mangrove is not defined");
            const market = await mangrove.market(pair);
            market.consoleAsks();
            market.consoleBids();
        } catch (error) {
            console.log(error);
        }
    };

    React.useEffect(() => {
        isConnected && signer?.provider && initMangrove();
    }, [isConnected, signer]);

    return (
        <MangroveContext.Provider
            value={{
                pair,
                setPair,
                mangrove,
                decimals: decimals ? decimals : 0,
                balance: balance
                    ? Number(formatUnits(balance as bigint, decimals || 0))
                    : 0,
                checkMarket,
            }}
        >
            {children}
        </MangroveContext.Provider>
    );
};

export default MangroveProvider;
