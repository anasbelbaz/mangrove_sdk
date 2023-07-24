import React from "react";
// context
import { useMangrove } from "../contexts/mangrove";
// shadcn
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
// lucide-react
import { Loader2 } from "lucide-react";
// notistack
import { enqueueSnackbar } from "notistack";
import { givesLiveBalance, wantsLiveBalance } from "../utils/utils";

const Post = () => {
    const { mangrove, pair, baseBalance, quoteBalance } = useMangrove();

    const [gives, setGives] = React.useState<string>("");
    const [wants, setWants] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);
    const [steps, setSteps] = React.useState<number>(1);

    const resetForm = () => {
        setGives("");
        setWants("");
        setSteps(1);
    };

    const post = async () => {
        try {
            if (!mangrove) throw new Error("Mangrove is not defined");

            setLoading(true);
            const market = await mangrove.market(pair);

            const directLP = await mangrove.liquidityProvider(market);

            const tx = await market.base.approve(mangrove.address, {
                amount: gives,
            });
            await tx.wait();

            enqueueSnackbar(`Tokens approved successfully`, {
                variant: "success",
            });
            setSteps(2);

            const fund = await directLP.computeAskProvision();

            // Post a new ask
            const receipt = await directLP.newAsk({
                gives,
                wants,
                fund,
            });

            setLoading(false);
            resetForm();
            enqueueSnackbar(
                <span>
                    {pair.quote} Offer posted with success.{" "}
                    <a
                        href={`https://mumbai.polygonscan.com/tx/${receipt.event.transactionHash}`}
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

    React.useEffect(() => {
        gives && wants && resetForm();
    }, [pair]);

    return (
        <div className="grid space-x-2">
            <div className="flex flex-col md:flex-row md:space-x-4 justify-between mt-2">
                <div className="flex flex-col w-full md:flex-row">
                    <Label htmlFor="amount-given" className="m-2">
                        Amount given
                    </Label>
                    <div className="flex flex-col w-full justify-between">
                        <Input
                            type="text"
                            className={`${
                                Number(gives) > baseBalance
                                    ? "border-2 border-red-500"
                                    : ""
                            }`}
                            value={gives}
                            aria-label="amount-given"
                            onChange={(e) => {
                                if (
                                    e.currentTarget.value &&
                                    !/^\d+(\.\d*)?$/.test(e.currentTarget.value)
                                )
                                    return;

                                setGives(e.currentTarget.value);
                            }}
                        />
                        <span
                            className={`text-xs mt-2 text-gray-500 ${
                                Number(gives) > baseBalance
                                    ? "text-red-500"
                                    : ""
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
                        Amount wanted
                    </Label>
                    <div className="flex flex-col w-full justify-between">
                        <Input
                            type="text"
                            value={wants}
                            aria-label="amount-wanted"
                            onChange={(e) => {
                                if (
                                    e.currentTarget.value &&
                                    !/^\d+(\.\d*)?$/.test(e.currentTarget.value)
                                )
                                    return;

                                setWants(e.currentTarget.value);
                            }}
                        />
                        <span className={`text-xs mt-2 text-gray-500`}>
                            {wantsLiveBalance(
                                quoteBalance,
                                Number(gives),
                                pair.quote
                            )}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col md:w-auto mt-4 md:mt-0">
                    <Button
                        onClick={post}
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
                            {steps === 1 ? `Approve` : "Post"}
                        </span>
                    </Button>
                </div>
            </div>
            <div className="flex justify-center  text-green-500 md:w-auto mt-4 mt-1">
                <span>
                    {wants &&
                        gives &&
                        `Price: ${(Number(wants) / Number(gives)).toFixed(8)}`}
                </span>
            </div>
        </div>
    );
};

export default Post;
