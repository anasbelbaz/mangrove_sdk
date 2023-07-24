import { useSwitchNetwork } from "wagmi";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { polygonMumbai } from "wagmi/chains";

const SwitchNetwork = () => {
    const { switchNetwork } = useSwitchNetwork();

    const changeNetwork = async () => {
        switchNetwork?.(polygonMumbai.id);
    };

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Switch network</DialogTitle>
                    <DialogDescription>
                        Please change network, to Mumbai.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Button onClick={changeNetwork}> Switch</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
export default SwitchNetwork;
