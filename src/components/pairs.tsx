// shadcn
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
// context
import { useMangrove } from "../contexts/mangrove";
// utils
import { pairToString, stringToPair, pairs } from "../utils/utils";

const Pairs = () => {
    const { pair, setPair } = useMangrove();

    const handlePairChange = (pair: string) => {
        const selectedPair = stringToPair(pair);
        setPair(selectedPair);
    };

    return (
        <div className="flex flex-col items-center justify-center">
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
        </div>
    );
};
export default Pairs;
