import React from "react";
// context
import { useMangrove } from "../contexts/mangrove";
// shadcn
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
// viem
import { formatUnits, parseUnits } from "viem";
// lucide-react
import { Loader2 } from "lucide-react";
// notistack
import { enqueueSnackbar } from "notistack";

const Sell = () => {
    const { mangrove, pair, balance, decimals } = useMangrove();
    const [gives, setGives] = React.useState<string>("");
    const [wants, setWants] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);

    const resetForm = () => {
        setGives("");
        setWants("");
    };

    const sell = async () => {
        try {
            if (!mangrove) throw new Error("Mangrove is not defined");
            setLoading(true);
            const market = await mangrove.market(pair);
            const [formatedWants, formatedGives] = [
                parseUnits(wants, decimals),
                parseUnits(gives, decimals),
            ];

            const buyPromises = await market.sell({
                wants: formatedWants,
                gives: formatedGives,
                slippage: 2,
            });
            await buyPromises.result;
            setLoading(false);
            resetForm();
            enqueueSnackbar(`${pair.base} sold with success`, {
                variant: "success",
            });
        } catch (error) {
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

    const handleReceive = async (amount: string) => {
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
        <div className="flex flex-col md:flex-row md:space-x-4 justify-between items-baseline mt-2">
            <div className="flex flex-col w-full md:flex-row">
                <Label htmlFor="amount-given" className="m-2">
                    Sell Amount
                </Label>
                <Input
                    className={`${
                        Number(gives) > balance ? "border-2 border-red-500" : ""
                    }`}
                    type="text"
                    id="amount-given"
                    value={gives}
                    aria-label="amount-given"
                    onChange={(e) => handleSend(e.currentTarget.value)}
                />
            </div>

            <div className="flex flex-col w-full md:flex-row">
                <Label htmlFor="amount-wanted" className="m-2">
                    Receive Amount
                </Label>
                <Input
                    type="text"
                    value={wants}
                    aria-label="amount-wanted"
                    onChange={(e) => handleReceive(e.currentTarget.value)}
                />
            </div>

            <div className="flex flex-col md:w-auto mt-4 md:mt-0 w-full">
                <Button
                    onClick={sell}
                    disabled={
                        !wants || !gives || loading || Number(gives) > balance
                    }
                >
                    {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sell
                </Button>
            </div>
        </div>
    );
};

export default Sell;
