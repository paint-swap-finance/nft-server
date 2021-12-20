const util = require("util");

const handler = async (event: any) => {
  try {
    console.log("stream received");
    const records = event.Records;
    for (const record of records) {
      console.log(util.inspect(record, false, null, true));
    }
  } catch (e) {
    console.error(e);
    return;
  }
};

export default handler;
