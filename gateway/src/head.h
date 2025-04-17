#ifndef HEAD_H
#define HEAD_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#ifdef HTTPS_SUPPORT 
#include <openssl/ssl.h>
#include <openssl/err.h>
#endif 

#define SERVER_PORT_NUMBER 8080
#define SERVER_IP "127.0.0.1"
#define MAX_BACKLOG 100

#define MAX_SERVER_CONNECTIONS 10

#define BEST_WEIGHT 5
#define MEDIUM_WEIGHT 3
#define LOW_WEIGHT 1

/*
A socket representing a server connection that HTTP requests will be routed to.
*/
typedef struct {
    const char * IP; 
    int serverfd; 
    struct sockaddr_in server_addr; 
    int port; 
    socklen_t server_len; 

    int weight; 
} SERVER_CONNECTION; 

/*
Creates a SERVER_CONNECTION object that the HEAD will send load towards. 
Returns -1 if not possible, i.e. IP is incorrect, 0 otherwise.
*/
int create_server(SERVER_CONNECTION * sc, const char * ip, int port); 

/*
Represents a HTTP server Load Balancer. 
*/
typedef struct {
    int socketfd; 
    struct sockaddr_in server_address;

    // dynamic list containing the servers we can push load to
    SERVER_CONNECTION * server_connections; 

    // ALWAYS the same size and indices filled as [server_connections]
    int * current_weights; 

    pthread_mutex_t connections_mutex; // necessary so that the two threads on main don't race

    // the number of connections we currently have 
    unsigned int num_connections; 

    int static_weight_sum;

    // SSL/TLS for HTTPS
    #ifdef HTTPS_SUPPORT
        // OpenSSL 
        SSL_CTX *ctx; 
        SSL * ssl; 
    #endif 

} HEAD; 

/* 
Creates a socket fd and sets [socketfd] with that value. 
Defines the server address and port, setting [server_address].
Binds the socket to the address and port. 
Dynamically allocates the [server_connections].
Initializes the [connections_mutex] object.
*/
void create_head(HEAD* s); 

/*
Tries to connect() to the servers in the network. 
*/
void add_server_connection(HEAD * s, const char * IP, int port); 

/* 
Main control loop that:
    1. listens for connections
    2. accepts the connections and spawns a child process
    3. parses the HTTP request 
    4. returns a HTTP response 
Runs on a separate thread than the main menu option thread. 
*/
void * run_head(void *arg); 

/*
Prints all of the currently existing server connections 
*/
void print_server_connections(HEAD * s);

/*
Frees the objects in the [server_connections] and the [current_weights]
*/
void cleanup(HEAD * s);

#endif 