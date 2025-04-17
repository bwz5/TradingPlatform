# HTTP Load Balancer (API Gateway)
 
 Receives orders from the UI server and sends them to the Order management system. 
 
 Distributes orders across the OMS server network via the smooth weighted round robin algorithm. 
 
 ## Build 
 `make head`
 `./head` to run.  
 
 ## Cleanup instructions: 
 `make clean`

 ## TODO :  
 Add HTTPS support for load balancer -> server communication 
