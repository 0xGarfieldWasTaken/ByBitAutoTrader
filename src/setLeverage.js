const { LinearClient } = require('bybit-api');
require("dotenv").config();

const createClient = () => {
    return client = new LinearClient(
        process.env.BYBIT_API_KEY,
        process.env.BYBIT_API_SECRET,
      
        // restClientOptions,
        // requestLibraryOptions
      );
}

const setLeverage = async () => {
    const client = createClient();

    const result = await client.setUserLeverage({symbol: "LUNAUSDT", buy_leverage: 5, sell_leverage: 5});
    console.log(result)
}

setLeverage();
