import { adapters } from "../adapters";
import invokeLambda from "../utils/invokeLambda";

const handler = async () => {
  console.log("running triggerAdapters")
  adapters.forEach(async (_, i) => {
    const event = {
      adapterIndex: i
    };
    console.log("running lambda", event)
    await invokeLambda(`defillama-nft-prod-triggerAdapter`, event);
  });
};

export default handler;
