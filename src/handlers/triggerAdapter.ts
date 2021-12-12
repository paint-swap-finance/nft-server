import { adapters } from "../adapters"

const handler = async (event: any) => {
  try {
    const { adapterIndex } = event;
    const adapter = adapters[adapterIndex]
    await adapter.run();
  } catch (e) {
    console.error(e);
    return;
  }
};

export default handler;
