// shadcn
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
// context
import { useMangrove } from "../contexts/mangrove";
// utils
import { pairToString, stringToPair, pairs } from "../utils/utils";
import { Label } from "./ui/label";

const Pairs = () => {
    const { pair, setPair } = useMangrove();

    const handlePairChange = (pair: string) => {
        const selectedPair = stringToPair(pair);
        setPair(selectedPair);
    };
    return (
        <>
            <Label htmlFor="amount-wanted" className="m-2">
                Select Pair
            </Label>
            <Select
                value={pairToString(pair)}
                onValueChange={handlePairChange}
                aria-label="select-token-symbol"
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Token" />
                </SelectTrigger>
                <SelectContent>
                    {pairs.map((pair) => (
                        <SelectItem
                            value={pairToString(pair)}
                            key={pairToString(pair)}
                        >
                            {pairToString(pair)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </>
    );
};
export default Pairs;
