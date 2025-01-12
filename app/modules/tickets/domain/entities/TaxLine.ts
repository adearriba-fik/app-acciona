import { MoneySet } from "./MoneySet";

export interface TaxLine {
    price: string;
    price_set: MoneySet;
    rate: number;
    title: string;
}
