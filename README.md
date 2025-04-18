# TradingPlatform

![TradingPlatform Architecture](/docs/Architecture.png "TradingPlatform Architecture").

# User Interface  
![User Interface](/docs/Dashboard.png "User Interface").

# Note: 
OMS contains:  
* OMS
* Risk management and Compliance Engine

I want to add HTTPS support between the load balancer and OMS too, but I only have self-signed SSL certificates, so I need to get public ones before I decide to do that.

# TODO:  
* Code review on /client /ui_service and /gateway 
* Making oms actually do something useful (connect it to cockroachDB)