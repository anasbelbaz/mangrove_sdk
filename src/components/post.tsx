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

const Post = () => {
    const { mangrove, pair, baseBalance } = useMangrove();

    const [gives, setGives] = React.useState<string>("");
    const [wants, setWants] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);

    const resetForm = () => {
        setGives("");
        setWants("");
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
                    <Input
                        type="text"
                        className={`${
                            Number(gives) > baseBalance
                                ? "border-2 border-red-500"
                                : ""
                        }`}
                        value={gives}
                        aria-label="amount-given"
                        onChange={(e) => setGives(e.currentTarget.value)}
                    />
                </div>
                <div className="flex flex-col w-full md:flex-row">
                    <Label htmlFor="amount-wanted" className="m-2">
                        Amount wanted
                    </Label>
                    <Input
                        type="text"
                        value={wants}
                        aria-label="amount-wanted"
                        onChange={(e) => setWants(e.currentTarget.value)}
                    />
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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Post
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
