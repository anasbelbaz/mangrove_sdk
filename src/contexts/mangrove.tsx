import React from "react";
// mangrove
import { Mangrove } from "@mangrovedao/mangrove.js";
// wagmi
import { erc20ABI, useAccount, useContractReads, useNetwork } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
// viewm
import { formatUnits } from "viem";
// hooks
import { useEthersSigner } from "../hooks/adapter";
// types
import { Pair } from "../types";
// utils
import { tokenAddress } from "../utils/utils";

type ContextValues = {
    mangrove: Mangrove | undefined;
    pair: Pair;
    baseDecimals: number;
    baseBalance: number;
    quoteDecimals: number;
    quoteBalance: number;
    isMumbai: boolean;
    checkMarket: () => void;
    setPair: (pair: Pair) => void;
    refreshBalances: () => void;
};

const defaultValues: ContextValues = {
    mangrove: undefined,
    pair: { base: "USDC", quote: "USDT" },
    baseDecimals: 0,
    baseBalance: 0,
    quoteDecimals: 0,
    quoteBalance: 0,
    isMumbai: false,
    checkMarket: () => null,
    setPair: () => null,
    refreshBalances: () => null,
};

const formatContractReads = (data: any) => {
    if (data && data[0].status === "success") {
        return {
            baseDecimals: Number(data[0].result),
            quoteDecimals: Number(data[2].result),
            baseBalance: Number(formatUnits(data[1].result, data[0].result)),
            quoteBalance: Number(formatUnits(data[3].result, data[2].result)),
        };
    }
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

    const { data, refetch } = useContractReads({
        contracts: [
            {
                address: tokenAddress(pair)[0] as `0x`,
                abi: erc20ABI,
                functionName: "decimals",
            },
            {
                address: tokenAddress(pair)[0] as `0x`,
                abi: erc20ABI,
                functionName: "balanceOf",
                args: [address || `0x`],
            },
            {
                address: tokenAddress(pair)[1] as `0x`,
                abi: erc20ABI,
                functionName: "decimals",
            },
            {
                address: tokenAddress(pair)[1] as `0x`,
                abi: erc20ABI,
                functionName: "balanceOf",
                args: [address || `0x`],
            },
        ],
        select: (data) => formatContractReads(data),
        cacheTime: 5000,
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

    const refreshBalances = () => {
        refetch();
    };

    React.useEffect(() => {
        isConnected && checkNetwork();
        isConnected && signer?.provider && initMangrove();
    }, [isConnected, signer, chain]);

    return (
        <MangroveContext.Provider
            value={{
                refreshBalances,
                isMumbai,
                baseDecimals: data?.baseDecimals || 0,
                baseBalance: data?.baseBalance || 0,
                quoteDecimals: data?.quoteDecimals || 0,
                quoteBalance: data?.quoteBalance || 0,
                pair,
                setPair,
                mangrove,
                checkMarket,
            }}
        >
            {children}
        </MangroveContext.Provider>
    );
};

export default MangroveProvider;
