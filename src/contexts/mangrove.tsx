import React from "react";
// mangrove
import { Mangrove } from "@mangrovedao/mangrove.js";
// wagmi
import { erc20ABI, useAccount, useContractRead, useNetwork } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
// viewm
import { formatUnits } from "viem";
// hooks
import { useEthersSigner } from "../hooks/adapter";
// types
import { Pair } from "../types";
// utils
import tokenList from "../utils/tokens/mangrove-tokens.json";
import erc20_abi from "../utils/tokens/abi.json";

type ContextValues = {
    mangrove: Mangrove | undefined;
    pair: Pair;
    decimals: number;
    balance: number;
    isMumbai: boolean;
    checkMarket: () => void;
    setPair: (pair: Pair) => void;
};

const defaultValues: ContextValues = {
    mangrove: undefined,
    pair: { base: "WETH", quote: "USDC" },
    decimals: 0,
    balance: 0,
    isMumbai: false,
    checkMarket: () => null,
    setPair: () => null,
};

const MangroveContext = React.createContext(defaultValues);
export const useMangrove = () => React.useContext(MangroveContext);

const MangroveProvider = ({ children }: React.PropsWithChildren) => {
    const { isConnected, address } = useAccount();
    const { chain } = useNetwork();

    const [mangrove, setMangrove] = React.useState<Mangrove | undefined>();
    const [isMumbai, setIsMumbai] = React.useState<boolean>(false);

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
            if (isMumbai) {
                const mgv = await Mangrove.connect({
                    signer,
                    provider: signer?.provider,
                });

                setMangrove(mgv);
            } else {
                throw new Error("Wrong wallet network");
            }
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

    const checkNetwork = async () => {
        if (chain && chain.id != polygonMumbai.id) {
            setIsMumbai(false);
        } else {
            setIsMumbai(true);
        }
    };

    React.useEffect(() => {
        isConnected && checkNetwork();
        isConnected && signer?.provider && initMangrove();
    }, [isConnected, signer, chain]);

    return (
        <MangroveContext.Provider
            value={{
                isMumbai,
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
