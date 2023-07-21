// shadcn
import { Card } from "../../components/ui/card";
// components
import { Navbar, MintFaucet, Buy, Sell, Post, Pairs } from "../../components";

const Home = () => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4">
            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex-col">
                <Navbar />
                <Card className="mx-auto mt-40 p-10">
                    <h1>Faucet</h1>
                    <MintFaucet />
                </Card>
                <Card className="mx-auto mt-10 p-10">
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
                </Card>
            </div>
        </main>
    );
};

export default Home;
