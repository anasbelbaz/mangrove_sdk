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
import { erc20ABI, useContractWrite, useWaitForTransaction } from "wagmi";
// utils
import {
    convertNumber,
    givesLiveBalance,
    tokenAddress,
    wantsLiveBalance,
} from "../utils/utils";

const Sell = () => {
    const {
        mangrove,
        pair,
        baseBalance,
        quoteBalance,
        refreshBalances,
        baseDecimals,
        quoteDecimals,
    } = useMangrove();

    const [gives, setGives] = React.useState<string>("");
    const [wants, setWants] = React.useState<string>("");
    const [steps, setSteps] = React.useState<number>(1);
    const [loading, setLoading] = React.useState<boolean>(false);

    const resetForm = () => {
        setGives("");
        setWants("");
        setSteps(1);
    };

    const { data: approveResponse, write } = useContractWrite({
        address: tokenAddress(pair)[0] as `0x`,
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
                setSteps(2);
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
                parseUnits(`${Number(gives) + 0.1}`, baseDecimals),
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
            const receipt = await sellPromise.result;

            setLoading(false);
            resetForm();
            refreshBalances();
            enqueueSnackbar(
                <span>
                    {pair.base} market order placed with success.{" "}
                    <a
                        href={`https://mumbai.polygonscan.com/tx/${receipt.txReceipt.transactionHash}`}
                        target="_blank"
                        className="underline"
                    >
                        See on Explorer
                    </a>
                </span>,
                {
                    variant: "success",
                    autoHideDuration: 10000,
                }
            );
        } catch (error) {
            setLoading(false);
            enqueueSnackbar("Transaction failed", { variant: "error" });
        }
    };

    const handleSend = async (amount: string) => {
        try {
            if (!amount) {
                resetForm();
                return;
            }

            if (amount && !/^\d+(\.\d*)?$/.test(amount)) {
                return;
            }

            if (!mangrove || !quoteDecimals)
                throw new Error("An error occured");

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
            if (amount && !/^\d+(\.\d*)?$/.test(amount)) {
                return;
            }

            if (!amount) {
                resetForm();
                return;
            }

            if (!mangrove || !baseDecimals) throw new Error("An error occured");

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
                <div className="flex flex-col w-full justify-between">
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
                    <span
                        className={`text-xs mt-2 text-gray-500 ${
                            Number(gives) > baseBalance ? "text-red-500" : ""
                        }`}
                    >
                        {givesLiveBalance(
                            baseBalance,
                            Number(gives),
                            pair.base
                        )}
                    </span>
                </div>
            </div>

            <div className="flex flex-col w-full md:flex-row">
                <Label htmlFor="amount-wanted" className="m-2">
                    Receive Amount
                </Label>
                <div className="flex flex-col w-full justify-between">
                    <Input
                        type="text"
                        value={wants}
                        aria-label="amount-wanted"
                        onChange={(e) => handleReceive(e.currentTarget.value)}
                    />
                    <span className=" text-xs mt-2 text-gray-500">
                        {wantsLiveBalance(
                            quoteBalance,
                            Number(wants),
                            pair.quote
                        )}
                    </span>
                </div>
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
                        <>
                            <span className="text-xs z-1000 mr-2">
                                {steps === 1 ? `1/2` : "2/2"}
                            </span>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        </>
                    )}
                    <span className="caption">
                        {steps === 1 ? `Approve` : "Sell"}
                    </span>
                </Button>
            </div>
        </div>
    );
};

export default Sell;
