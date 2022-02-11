import { HistoricalStatistics, Sale } from "../src/models";
import { Blockchain, Marketplace } from "../src/types";

const main = async (
  slug: string,
  chain: Blockchain,
  marketplace: Marketplace
) => {
  try {
    console.log("Getting sales...");
    const { data: sales, cursor } = await Sale.getAll({ slug, marketplace });

    if (cursor) {
      console.log(
        "Warning: not all sales were retrieved, use cursor to paginate"
      );
    }

    console.log("Getting old historical statistics...");
    const statistics = await HistoricalStatistics.getCollectionStatistics(slug);
    const oldVolumes = statistics.reduce((volumes, statistic) => {
      const timestamp = statistic.SK;
      const volume = statistic[`marketplace_${marketplace}_volume`];
      const volumeUSD = statistic[`marketplace_${marketplace}_volumeUSD`];

      volumes[timestamp] = {
        volume,
        volumeUSD,
      };

      return volumes;
    }, {});

    console.log("Calculating new historical statistics...");
    const newVolumes = await HistoricalStatistics.getDailyVolumesFromSales({
      sales,
    });

    console.log("Deleting old historical statistics...");
    await HistoricalStatistics.delete({
      slug,
      chain,
      marketplace,
      volumes: oldVolumes,
    });

    console.log("Inserting new historical statistics...");
    await HistoricalStatistics.updateCollectionStatistics({
      slug,
      chain,
      marketplace,
      volumes: newVolumes,
    });

    return "Successfully rebuilt historical statistics";
  } catch (e) {
    console.log(e.message);
    return "Error rebuilding historical statistics";
  }
};

main("realms-of-ether-1", Blockchain.Ethereum, Marketplace.Opensea).then(
  (result) => console.log(result)
);
