import React from "react";
// hooks
import { useEthersSigner } from "../hooks/adapter";
// mangrove
import { Mangrove, Market } from "@mangrovedao/mangrove.js";
// wagmi
import { useAccount } from "wagmi";
// types
import { Pair } from "../types";

type ContextValues = {
    mangrove: Mangrove | undefined;
    book: Market.Book | undefined;
    pair: Pair;
    checkMarket: () => void;
    setPair: (pair: Pair) => void;
};

const defaultValues: ContextValues = {
    mangrove: undefined,
    book: undefined,
    pair: { base: "WETH", quote: "USDC" },
    checkMarket: () => null,
    setPair: () => null,
};

const MangroveContext = React.createContext(defaultValues);
export const useMangrove = () => React.useContext(MangroveContext);

const MangroveProvider = ({ children }: React.PropsWithChildren) => {
    const { isConnected } = useAccount();

    const [mangrove, setMangrove] = React.useState<Mangrove | undefined>(
        undefined
    );
    const [book, setBook] = React.useState<Market.Book | undefined>(undefined);
    const [pair, setPair] = React.useState<Pair>({
        base: "USDC",
        quote: "USDT",
    });

    const signer = useEthersSigner();

    const initMangrove = async () => {
        try {
            const mgv = await Mangrove.connect({
                signer,
                provider: signer?.provider,
            });

            setMangrove(mgv);
            await getBook(mgv);
        } catch (error) {
            console.log(error);
        }
    };

    const getBook = async (mgv: Mangrove) => {
        try {
            const market = await mgv.market(pair);
            const book = market.getBook();
            setBook(book);
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
            value={{ pair, setPair, mangrove, book, checkMarket }}
        >
            {children}
        </MangroveContext.Provider>
    );
};

export default MangroveProvider;
