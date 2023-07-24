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
// utils
import tokenList from "../utils/tokens/mangrove-tokens.json";
import {
    erc20ABI,
    useContractRead,
    useContractWrite,
    useWaitForTransaction,
} from "wagmi";

const Buy = () => {
    const { mangrove, pair, quoteBalance, refreshBalances } = useMangrove();

    const tokenAddress = [
        tokenList.find((token) => token.symbol === pair.base)?.address,
        tokenList.find((token) => token.symbol === pair.quote)?.address,
    ];
    const { data: baseDecimals } = useContractRead({
        address: tokenAddress[0] as `0x`, // base contract
        abi: erc20ABI,
        functionName: "decimals",
    });

    const { data: quoteDecimals } = useContractRead({
        address: tokenAddress[1] as `0x`, // quote contract
        abi: erc20ABI,
        functionName: "decimals",
    });

    const [gives, setGives] = React.useState<string>("");
    const [wants, setWants] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);

    const resetForm = () => {
        setGives("");
        setWants("");
    };

    const { data: approveResponse, write } = useContractWrite({
        address: tokenAddress[0] as `0x`,
        abi: erc20ABI,
        functionName: "approve",
        onError() {
            setLoading(false);
            enqueueSnackbar("Approve failed", { variant: "error" });
        },
    });

    useWaitForTransaction({
        hash: approveResponse?.hash,
        onSettled(d, error) {
            if (error) {
                enqueueSnackbar(error.message, { variant: "error" });
            } else if (d) {
                enqueueSnackbar(`Tokens approved successfully`, {
                    variant: "success",
                });
                //note: temporary timeout
                setTimeout(() => {
                    buy();
                }, 5000);
            }
        },
    });

    const setApproval = async () => {
        if (!mangrove || !baseDecimals)
            throw new Error("Mangrove is not defined");

        setLoading(true);
        write?.({
            args: [
                "0xd1805f6Fe12aFF69D4264aE3e49ef320895e2D8b",
                parseUnits(gives, baseDecimals),
            ],
        });
    };

    const buy = async () => {
        try {
            if (!mangrove) throw new Error("Mangrove is not defined");

            setLoading(true);
            const market = await mangrove.market(pair);

            const buyPromises = await market.buy({
                wants,
                gives,
                slippage: 2, //TODO@Anas: add slippage input in order to dynamise its value
            });

            await buyPromises.result;
            setLoading(false);
            resetForm();
            refreshBalances();
            enqueueSnackbar(`${pair.quote} Bought with success`, {
                variant: "success",
            });
        } catch (error) {
            setLoading(false);
            enqueueSnackbar("Transaction failed", { variant: "error" });
        }
    };

    const handleSend = async (amount: string) => {
        try {
            if (!mangrove || !amount || !quoteDecimals)
                throw new Error("Mangrove is not defined");

            setGives(amount);

            const market = await mangrove.market(pair);
            const estimated = await market.estimateVolumeToReceive({
                given: amount,
                what: "quote",
            });

            setWants(
                Number(
                    formatUnits(
                        estimated.estimatedVolume,
                        quoteDecimals
                    ).replace(/\.(?=[^.]*$)/, "")
                ).toFixed(quoteDecimals)
            );
        } catch (error) {
            enqueueSnackbar("Could not estimate volume", { variant: "error" });
        }
    };

    const handleBuy = async (amount: string) => {
        try {
            if (!mangrove || !amount || !quoteDecimals)
                throw new Error("Mangrove is not defined");

            setWants(amount);
            const market = await mangrove.market(pair);

            const estimated = await market.estimateVolumeToSpend({
                given: amount,
                what: "base",
            });

            setGives(
                Number(
                    formatUnits(
                        estimated.estimatedVolume,
                        quoteDecimals
                    ).replace(/\.(?=[^.]*$)/, "")
                ).toFixed(quoteDecimals)
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
                        Number(gives) > quoteBalance
                            ? "border-2 border-red-500"
                            : ""
                    }`}
                    type="text"
                    value={gives}
                    aria-label="amount-given"
                    onChange={(e) => handleSend(e.currentTarget.value)}
                />
            </div>
            <div className="flex flex-col md:w-auto mt-4 md:mt-0">
                <Button
                    onClick={setApproval}
                    disabled={
                        !wants ||
                        !gives ||
                        loading ||
                        Number(gives) > quoteBalance
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
