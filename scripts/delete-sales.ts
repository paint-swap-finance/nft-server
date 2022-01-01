import { Sale } from "../src/models";

// Example (CryptoPunks flashloan sale)
const sales = [
  {
    slug: "cryptopunks",
    chain: "ethereum",
    marketplace: "opensea",
    timestamp: "1635465037000",
    txnHash:
      "0x92488a00dfa0746c300c66a716e6cc11ba9c0f9d40d8c58e792cc7fcebf432d0",
    priceUSD: "490869983",
    priceBase: "124457.06752488602",
  },
];

const main = async () => {
  try {
    console.log("Manually deleting", sales.length, "sales");
    for (const sale of sales) {
      console.log("Deleting sale", sale.txnHash);
      await Sale.delete(sale);
    }
    return "Successfully deleted sales";
  } catch (e) {
    console.log(e.message);
    return "Error deleting sales";
  }
};

main().then((result) => console.log(result));
