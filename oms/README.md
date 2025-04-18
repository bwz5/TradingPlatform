# Manages incoming orders 

## This system will:

* Receive order request 
* Verify that the user can actually make the request 
* Pre-execution risk check
* Add order to queue of orders 
* Pop off the queue and send it to the order matching engine 
* Post execution risk check 
* Update the database with the matching engine's most recent calculation 
* send response back to web server 