import React from "react";
// shadcn
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
// context
import { useMangrove } from "../contexts/mangrove";
// viem
import { formatUnits, parseUnits } from "viem";
// lucide-react
import { Loader2 } from "lucide-react";
// notistack
import { enqueueSnackbar } from "notistack";

const Buy = () => {
    const { mangrove, pair, balance, decimals } = useMangrove();
    const [gives, setGives] = React.useState<string>("");
    const [wants, setWants] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);

    const resetForm = () => {
        setGives("");
        setWants("");
    };

    const buy = async () => {
        try {
            if (!mangrove) throw new Error("Mangrove is not defined");
            setLoading(true);
            const market = await mangrove.market(pair);

            const [formatedWants, formatedGives] = [
                parseUnits(wants, decimals),
                parseUnits(gives, decimals),
            ];

            const buyPromises = await market.buy({
                wants: formatedWants,
                gives: formatedGives,
                slippage: 2, //TODO@Anas: add slippage input in order to dynamise its value
            });
            await buyPromises.result;
            setLoading(false);
            resetForm();
            enqueueSnackbar(`${pair.base} Bought with success`, {
                variant: "success",
            });
        } catch (error) {
            console.log(error);
            setLoading(false);
            enqueueSnackbar("Transaction failed", { variant: "error" });
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
                formatUnits(estimated.estimatedVolume as bigint, decimals)
            );
        } catch (error) {
            enqueueSnackbar("Could not estimate volume", { variant: "error" });
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
                formatUnits(estimated.estimatedVolume as bigint, decimals)
            );
        } catch (error) {
            enqueueSnackbar("Could not estimate volume", { variant: "error" });
        }
    };

    React.useEffect(() => {
        gives && wants && resetForm();
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
                    Paid Amount
                </Label>
                <Input
                    className={`${
                        Number(gives) > balance ? "border-2 border-red-500" : ""
                    }`}
                    type="text"
                    value={gives}
                    aria-label="amount-given"
                    onChange={(e) => handleSend(e.currentTarget.value)}
                />
            </div>
            <div className="flex flex-col md:w-auto mt-4 md:mt-0">
                <Button
                    onClick={buy}
                    disabled={
                        !wants || !gives || loading || Number(gives) > balance
                    }
                >
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
