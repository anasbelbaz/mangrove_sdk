export type Pair = { base: string; quote: string };

export type OrderBook = {
    id: string;
    maker: string;
    volume: number;
    price: number;
};
