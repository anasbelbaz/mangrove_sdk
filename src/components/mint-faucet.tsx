"use client";
import React from "react";
// chadcn
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
// wagmi
import { useContractWrite, useContractReads, useAccount } from "wagmi";
// web3modal
import { useWeb3Modal } from "@web3modal/react";
// utils
import tokens from "../utils/tokens/mangrove-tokens.json";
import erc20_abi from "../utils/tokens/abi.json";
// viewm
import { formatUnits, parseUnits } from "viem";

const MintFaucet = () => {
    const [token, SetToken] = React.useState<string>("");
    const [amount, setAmount] = React.useState<string>("0");

    const formatContractReads = (data: any) => {
        if (data && data[0].status === "success") {
            return {
                mintLimit: formatUnits(
                    data[0].result as bigint,
                    Number(data[1].result)
                ),
                decimals: Number(data[1].result),
            };
        }
    };

    const { data } = useContractReads({
        contracts: [
            {
                address: token as `0x`,
                abi: [
                    {
                        inputs: [],
                        name: "mintLimit",
                        outputs: [
                            {
                                internalType: "uint256",
                                name: "",
                                type: "uint256",
                            },
                        ],
                        stateMutability: "view",
                        type: "function",
                    },
                ],
                functionName: "mintLimit",
            },
            {
                address: token as `0x`,
                abi: [
                    {
                        inputs: [],
                        name: "decimals",
                        outputs: [
                            { internalType: "uint8", name: "", type: "uint8" },
                        ],
                        stateMutability: "view",
                        type: "function",
                    },
                ],
                functionName: "decimals",
            },
        ],
        select: (data) => formatContractReads(data),
        cacheTime: 5000,
        enabled: !!token,
    });

    const { write } = useContractWrite({
        address: token as `0x`,
        abi: erc20_abi,
        functionName: "mint",
    });

    const { decimals, mintLimit } = data
        ? data
        : { decimals: 0, mintLimit: "0" };

    const mintToken = () => {
        data && write?.({ args: [parseUnits(amount, decimals)] });
    };

    const { open } = useWeb3Modal();
    const { isConnected } = useAccount();

    return (
        <div className="flex flex-col md:flex-row md:space-x-2 justify-between mt-2">
            <div className="flex w-full md:w-auto md:space-x-2">
                <Select
                    onValueChange={SetToken}
                    aria-label="select-token-symbol"
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Token" />
                    </SelectTrigger>
                    <SelectContent>
                        {tokens.map((token) => (
                            <SelectItem
                                value={token.address}
                                key={token.address}
                            >
                                {token.symbol}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col space-y-1">
                <Input
                    type="text"
                    value={amount}
                    aria-label="tokens-amount"
                    onChange={(e) => setAmount(e.currentTarget.value)}
                    max={Number(mintLimit)}
                    disabled={!mintLimit}
                    className="w-full"
                />
                {Number(mintLimit) > 0 && (
                    <span
                        className="cursor-pointer text-green-500 hover:text-black"
                        onClick={() => setAmount(`${Number(mintLimit)}`)}
                    >
                        Max: {Number(mintLimit)}
                    </span>
                )}
            </div>
            <div className="flex flex-col w-full md:w-auto md:space-x-2">
                <Button
                    onClick={isConnected ? mintToken : open}
                    disabled={
                        Number(mintLimit) - Number(amount) >= Number(mintLimit)
                    }
                    className="w-full"
                >
                    Mint
                </Button>
            </div>
        </div>
    );
};

export default MintFaucet;
