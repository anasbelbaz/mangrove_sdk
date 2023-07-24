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

    const tokenAddress = [
        tokenList.find((token) => token.symbol === pair.base)?.address,
        tokenList.find((token) => token.symbol === pair.quote)?.address,
    ];

    const { data: baseDecimals } = useContractRead({
        address: tokenAddress[0] as `0x`,
        abi: erc20ABI,
        functionName: "decimals",
    });
    const { data: quoteDecimals } = useContractRead({
        address: tokenAddress[1] as `0x`,
        abi: erc20ABI,
        functionName: "decimals",
    });

    const { data: baseBalance, refetch: getBaseBalance } = useContractRead({
        address: tokenAddress[0] as `0x`,
        abi: erc20_abi,
        functionName: "balanceOf",
        args: [address],
        enabled: !!address,
    });

    const { data: quoteBalance, refetch: getQuoteBalance } = useContractRead({
        address: tokenAddress[1] as `0x`,
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

    const refreshBalances = async () => {
        getBaseBalance();
        getQuoteBalance();
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
                baseDecimals: Number(quoteDecimals),
                baseBalance: baseBalance
                    ? Number(
                          formatUnits(baseBalance as bigint, baseDecimals || 0)
                      )
                    : 0,
                quoteDecimals: Number(quoteDecimals),
                quoteBalance: quoteBalance
                    ? Number(
                          formatUnits(
                              quoteBalance as bigint,
                              quoteDecimals || 0
                          )
                      )
                    : 0,
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
