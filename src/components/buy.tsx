import React from "react";
// shadcn
import { Button } from "./ui/button";

import { Input } from "./ui/input";
// context
import { useMangrove } from "../contexts/mangrove";
import tokenList from "../utils/tokens/mangrove-tokens.json";
// wagmi
import { erc20ABI, useContractRead } from "wagmi";
// viem
import { formatUnits } from "viem";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";

const Buy = () => {
    const { mangrove, pair } = useMangrove();
    const [gives, setGives] = React.useState<string>("");
    const [wants, setWants] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);

    const { data: decimals } = useContractRead({
        address:
            (tokenList.find((token) => token.symbol === pair.base)
                ?.address as `0x`) || `0x`,
        abi: erc20ABI,
        functionName: "decimals",
    });

    const resetForm = () => {
        setGives("");
        setWants("");
    };

    const buy = async () => {
        try {
            if (!mangrove) throw new Error("Mangrove is not defined");
            setLoading(true);
            const market = await mangrove.market(pair);

            const buyPromises = await market.buy({
                wants,
                gives,
                slippage: 2,
            });
            await buyPromises.result;
            setLoading(false);
            resetForm();
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    };

    const handleSend = async (amount: string) => {
        try {
            if (!amount || !decimals) return;
            if (!mangrove) throw new Error("Mangrove is not defined");

            setGives(amount);

            const market = await mangrove.market(pair);
            const estimated = await market.estimateVolumeToReceive({
                given: amount,
                what: "quote",
            });

            setWants(
                formatUnits(
                    estimated.estimatedVolume as bigint,
                    decimals
                ).substring(0, 10)
            );
        } catch (error) {
            console.log(error);
        }
    };

    const handleBuy = async (amount: string) => {
        try {
            if (!amount || !decimals) return;
            if (!mangrove) throw new Error("Mangrove is not defined");

            setWants(amount);
            const market = await mangrove.market(pair);

            const estimated = await market.estimateVolumeToSpend({
                given: amount,
                what: "base",
            });

            setGives(
                formatUnits(
                    estimated.estimatedVolume as bigint,
                    decimals
                ).substring(0, 10)
            );
        } catch (error) {
            console.log(error);
        }
    };

    React.useEffect(() => {
        resetForm();
    }, [pair]);

    return (
        <div className="flex flex-col md:flex-row md:space-x-4 justify-between mt-2">
            <div className="flex flex-col w-full md:flex-row">
                <Label htmlFor="amount-wanted" className="m-2">
                    Buy Amount
                </Label>
                <Input
                    type="text"
                    value={wants}
                    aria-label="amount-wanted"
                    onChange={(e) => handleBuy(e.currentTarget.value)}
                />
            </div>
            <div className="flex flex-col w-full md:flex-row">
                <Label htmlFor="amount-given" className="m-2">
                    Send Amount
                </Label>
                <Input
                    type="text"
                    value={gives}
                    aria-label="amount-given"
                    onChange={(e) => handleSend(e.currentTarget.value)}
                />
            </div>
            <div className="flex flex-col md:w-auto mt-4 md:mt-0">
                <Button onClick={buy} disabled={!wants || !gives || loading}>
                    {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Buy
                </Button>
            </div>
        </div>
    );
};

export default Buy;
