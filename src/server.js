const { LinearClient } = require('bybit-api');

require("dotenv").config();

const startServer = () => {
    const express = require('express');
    const client = createClient(); //ByBitClient

    const app = express();
    const PORT = 3000;

    app.use(express.json());

    app.post("/hook", async (req, res) => {
        await evaluate(req.body, client);
        res.status(200).end();
    })

    app.listen(PORT, () => console.log(`Server Running on PORT ${PORT}`));
}

// HOOK DATA FUNCTIONS

const evaluate = async (data, client) => {

    const dataSplit = data.content.split("-");
    let [side, ticker] = [dataSplit[0], dataSplit[1]];
    console.log(side, ticker);

    if (await isPositionActive(client, ticker)) {
        await closePositions(client, ticker);
    }

    if (await getOutstandingOrders(client, ticker)) {
        await cancelAllOrders(client, ticker);
    }

    if (side == "B") {
        side = "Buy";
    } else if (side == "S") {
        side = "Sell";
    }

    let price = null;
    let largestSize = 0;

    try{
        const priceData = await getIndexPrice(client, ticker);
        if (side == "Buy") {
            price = priceData[0].low;
        } else if (side == "Sell") {
            price = priceData[0].high;
        }
        if (price == null){
            throw new Error("Index Price not found");
        }
    } catch (e) {
        console.log(e)
        const orderBook = await getOrderBook(client, ticker);
        
        for (order in orderBook) {
            if (orderBook[order].side == side) {
                if (orderBook[order].size > largestSize) {
                    price = orderBook[order].price;
                    largestSize = orderBook[order].size;
                }
            }
        }
    }

    const walletData = await getWalletBalance(client);
    const [equity, balance] = [walletData.equity, walletData.balance];

    const CURRENT_LEVERAGE = 10;
    const qty = (((equity*0.1)*CURRENT_LEVERAGE)/price).toFixed(3);

    await placeOrder(client, ticker, price, side, qty);
}

// BYBIT FUNCTIONS

const getOutstandingOrders = async (client, ticker) => {
    const order = await client.queryActiveOrder({symbol: ticker+"USDT"})

    const orderList = order.result;

    if (orderList.length != 0) {
        console.log("Active Orders")
        return true
    } else {
        return false
    }
}

const isPositionActive = async (client, ticker) => {
    const position = await client.getPosition({symbol: ticker+"USDT"})

    const positions = position.result;

    for (p in positions) {
        if (positions[p].size != 0){
            console.log(`Active poition in the market: Size = ${positions[p].size} Side = ${positions[p].side}`)
            return true
        }
    }

    return false
}

const getPositionSize = async (client, ticker) => {
    const position = await client.getPosition({symbol: ticker+"USDT"})

    const positions = position.result;

    for (p in positions) {
        if (positions[p].size != 0){
            console.log(`Active poition in the market: Size = ${positions[p].size} Side = ${positions[p].side}`)
            return [positions[p].size, positions[p].side]
        }
    }

    return [0, null]
}

const closePositions = async (client, ticker) => {

    let [qty, side] = await getPositionSize(client, ticker)

    console.log(qty, side)

    if (side == "Buy") {
        side = "Sell" 
    } else if (side == "Sell") {
        side = "Buy"
    }

    const result = await client.placeActiveOrder({
        side: side,
        symbol: ticker+"USDT",
        order_type: "Market",
        qty: qty,
        time_in_force: "GoodTillCancel",
        close_on_trigger: false,
        reduce_only: true,
    });

    return result
}

const cancelAllOrders = async (client, ticker) => { 
    const result = await client.cancelAllActiveOrders({symbol: ticker+"USDT"})

    return result
}

const getLatestData = async (client, ticker) => {

    const serverTime = await getServerTime(client);

    const result = await client.getMarkPriceKline({symbol: ticker+"USDT", interval: "1", from: serverTime})

    return result.result
}

const getIndexPrice = async (client, ticker) => {

    //const serverTime = await getServerTime(client);
    var ts = Math.round((new Date()).getTime() / 1000);

    const result = await client.getIndexPriceKline({symbol: ticker+"USDT", interval: "1", from: ts-60})

    return result.result
}

const getKline = async (client, ticker) => {

    const serverTime = await getServerTime(client);

    const result = await client.getKline({symbol: ticker+"USDT", interval: "1", from: serverTime-20})

    return result.result
}

const getOrderBook = async (client, ticker) => {

    const serverTime = await getServerTime(client);

    const result = await client.getOrderBook({symbol: ticker+"USDT"})

    return result.result
}

const placeOrder = async (client, ticker, price, side, qty) => {

    const result = await client.placeActiveOrder({
        side: side,
        symbol: ticker+"USDT",
        order_type: "Limit",
        qty: qty,
        price: price,
        time_in_force: "GoodTillCancel",
        close_on_trigger: false,
        reduce_only: false,
    });

    return result

}

const getServerTime = async (client) => {
    const result = await client.getServerTime()
    return Math.floor(result.time_now);
}

const getWalletBalance = async (client) => {
    const walletData = await client.getWalletBalance()
    return walletData.result.USDT
}

const createClient = () => {
    return client = new LinearClient(
        process.env.BYBIT_API_KEY,
        process.env.BYBIT_API_SECRET,
      
        // restClientOptions,
        // requestLibraryOptions
      );
}

module.exports = startServer;
