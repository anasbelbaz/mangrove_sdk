// shadcn
import { Card } from "../../components/ui/card";
// components
import { Navbar, MintFaucet, Buy, Sell, Post, Pairs } from "../../components";
import { Button } from "../../components/ui/button";
import SwitchNetwork from "../../components/switchNetwork";
// wagmi
import { useAccount } from "wagmi";
// web3modal
import { useWeb3Modal } from "@web3modal/react";
// context
import { useMangrove } from "../../contexts/mangrove";

const Home = () => {
    const { isConnected } = useAccount();
    const { open } = useWeb3Modal();
    const { isMumbai } = useMangrove();

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4">
            {!isMumbai && <SwitchNetwork />}
            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex-col">
                <Navbar />
                <Card className="mx-auto mt-40 p-10">
                    <MintFaucet />
                </Card>
                <Card className="mx-auto mt-10 p-10">
                    {isConnected && (
                        <div className="flex flex-col space-y-4">
                            <div className="flex flex-col items-center justify-center p-4 w-full">
                                <Pairs />
                            </div>
                            <div className="p-4">
                                <Buy />
                            </div>
                            <div className="p-4">
                                <Sell />
                            </div>
                            <div className="p-4">
                                <Post />
                            </div>
                        </div>
                    )}

                    {!isConnected && (
                        <Button onClick={open}> Connect wallet </Button>
                    )}
                </Card>
            </div>
        </main>
    );
};

export default Home;
