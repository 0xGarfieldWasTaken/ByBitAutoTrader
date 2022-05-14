# ByBit Auto Trader

Recieves Webhook alerts from TradingView and executes.

Only opens one trade per Symbol at a time.

Currently the trade uses signals from a 5m Range Filter. Soon, I wish to adapt the system to generate signals from H4 and D1 MA Trend Line Retests and Horizontal Retests.

The system accepts alerts in the format {"content": "*x*-*y*"} where *x* is the side, either B or S, and *y* is the Ticker of the asset traded.
This means that as long as TradingView outputs the correct format to the Webhook address then the trade will be placed as a market order.

Entries to trades are placed immediately with a configurable Stop-Loss and Take-Profit. Any proceeding trades on a single ticker will the close out the existing position and then open a new one.

Currently, the Server uses Express. Something I have only used for the first time in this project. Express only looks for alerts send to a Webhook address and then parses the data that it gets. 

I have used ngrok to open the URL to the internet, but any service with similar capabilities will be fine.

By 0xGarfield