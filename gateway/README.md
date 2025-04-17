# HTTPS Load Balancer (API Gateway)

Receives orders from the UI server and sends them to the Order management system. 

Distributes orders across the OMS server network via the smooth weighted round robin algorithm. 

## HTTPS Support:  
For SSL/TLS encryption, see the /security/server* files. Fill them with your certificate and key. 

Next, you must install `openssl` on your system, either with a package manager or from source. It can be found here:  https://github.com/openssl/openssl?tab=readme-ov-file.  
See the Makefile to change the "-L" argument on line 43 if your openssl is installed elsewhere. 

Then,  
`make head SECURE=1`  
`./head` to run.  

## Cleanup instructions: 
`make clean`