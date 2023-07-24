import React from "react";
// context
import { useMangrove } from "../contexts/mangrove";
// shadcn
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
// viem
import { parseUnits } from "viem";
// lucide-react
import { Loader2 } from "lucide-react";
// notistack
import { enqueueSnackbar } from "notistack";
import {
    erc20ABI,
    useContractRead,
    useContractWrite,
    useWaitForTransaction,
} from "wagmi";
// utils
import tokenList from "../utils/tokens/mangrove-tokens.json";
import { convertNumber } from "../utils/utils";

const Sell = () => {
    const { mangrove, pair, baseBalance, refreshBalances } = useMangrove();

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
                    sell();
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

    const sell = async () => {
        try {
            if (!mangrove) throw new Error("Mangrove is not defined");

            setLoading(true);
            const market = await mangrove.market(pair);

            const sellPromise = await market.sell({
                wants,
                gives,
                slippage: 2, //TODO@Anas: add slippage input in order to dynamise its value
            });
            await sellPromise.result;

            setLoading(false);
            resetForm();
            refreshBalances();
            enqueueSnackbar(`${pair.base} market order placed with success`, {
                variant: "success",
            });
        } catch (error) {
            setLoading(false);
            enqueueSnackbar("Transaction failed", { variant: "error" });
        }
    };

    const handleSend = async (amount: string) => {
        try {
            if (!amount || !quoteDecimals) return;
            if (!mangrove) throw new Error("Mangrove is not defined");

            setGives(amount);

            const market = await mangrove.market(pair);
            const estimated = await market.estimateVolumeToReceive({
                given: amount,
                what: "base",
            });

            setWants(convertNumber(estimated.estimatedVolume, quoteDecimals));
        } catch (error) {
            enqueueSnackbar("Could not estimate volume", { variant: "error" });
        }
    };

    const handleReceive = async (amount: string) => {
        try {
            if (!amount || !baseDecimals) return;
            if (!mangrove) throw new Error("Mangrove is not defined");

            setWants(amount);
            const market = await mangrove.market(pair);

            const estimated = await market.estimateVolumeToSpend({
                given: amount,
                what: "quote",
            });

            setGives(convertNumber(estimated.estimatedVolume, baseDecimals));
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
                        Number(gives) > baseBalance
                            ? "border-2 border-red-500"
                            : ""
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
                    onClick={setApproval}
                    disabled={
                        !wants ||
                        !gives ||
                        loading ||
                        Number(gives) > baseBalance
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
