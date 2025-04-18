# Manages incoming orders 

## This system will:

* Receive order request (uWebSockets)
* Verify that the user can actually make the request (libpq for cockroachDB database)
* Pre-execution risk check (approve everything for right now)
* Add order to queue of orders (have a ring buffer that is the queue, mutex lock on it, matching engine will take from it and execute )
* Pop off the queue and send it to the order matching engine 
* Post execution risk check 
* Update the database with the matching engine's most recent calculation 
* send response back to web server 