#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include "../lib/picohttpparser.h"
#include "http_response.h"

#define SERVER_PORT_NUMBER 4000
#define SERVER_IP "127.0.0.1" // load balancer IP MUST CHANGE 
#define MAX_BACKLOG 100
#define HTTP_REQUEST_SIZE 4096

/*
Represents a server that will 
*/
typedef struct {
    int socketfd; 
    struct sockaddr_in server_address;
} server; 

/* 
Creates a socket fd and sets [socketfd] with that value. 
Defines the server address and port, setting [server_address].
Binds the socket to the address and port. 
*/
void create_server(server* s); 

/* 
Main control loop that:
    1. listens for connection from Load Balancer 
    2. accepts the connection and spawns a child process
    3. parses the HTTP request 
    4. returns a HTTP response to the Load Balancer 
*/
void run_server(server* s); 

void create_server(server * s){
    s->socketfd = socket(AF_INET, SOCK_STREAM, 0); 

    if (s->socketfd < 0) {
        printf("Server socket creation failed.\n");
        exit(EXIT_FAILURE);
    }

    inet_aton(SERVER_IP,(struct in_addr*)&s->server_address.sin_addr); 
    s->server_address.sin_port = htons(SERVER_PORT_NUMBER); 
    s->server_address.sin_family = AF_INET; 
    
    char ip_str[INET_ADDRSTRLEN];

    // Convert to text string 
    if (inet_ntop(AF_INET, &(s->server_address.sin_addr), ip_str, INET_ADDRSTRLEN) != NULL) {
        printf("IP Address: %s\n", ip_str);
    } else {
        printf("Error converting the IP string to an address.\n");
        exit(EXIT_FAILURE);
    }

    printf("Server started on address %s and port %i\n", ip_str, SERVER_PORT_NUMBER);

    if (bind(s->socketfd, (struct sockaddr *)&s->server_address, sizeof(s->server_address)) < 0){
        printf("Failure to bind the socketfd with the sockaddr_in struct\n"); 
        exit(EXIT_FAILURE); 
    }
}

const char * extract_substring(const char * buf, int start, int length){
  char *out = malloc(length + 1);
    if (!out) return NULL;               /* always check malloc */

    memcpy(out, buf + start, length);       /* faster than the loop */
    out[length] = '\0';                     /* NUL‑terminate */
    return out;                          /* caller must free() */
}

void run_server(server * s){
    // listen on the socketfd and set the maximum number of queued connections 
    if (listen(s->socketfd, MAX_BACKLOG ) < 0){
        printf("Failed to listen to the socket\n");
        exit(-1); 
    }

    int headfd; 
    struct sockaddr_in head_addr; 
    socklen_t head_len = sizeof(head_addr); 

    while (1) {
        // load balancer is sending data
        headfd = accept(s->socketfd, (struct sockaddr *)&head_addr, (socklen_t *)&head_len);

        if (headfd < 0){
            printf("Failed to connect to the client\n"); 
            exit(-1); 
        }

        // fork() here to process the HTTP request on a separate thread 
        pid_t PID = fork(); 

        if (PID != 0){
            // parent
            close(headfd);
            continue; 
        }

        // handle the incoming data from the Load Balancer 
        char buffer[HTTP_REQUEST_SIZE] = {0}; 
        size_t bytes_read = recv(headfd, buffer, sizeof(buffer)-1, 0); 
        if (bytes_read < 0) {
            printf("Error reading the clientfd\n"); 
            exit(-1);
        }

        // HTTP MESSAGE PARSING
        const char *method, *path;
        int pret, minor_version;
        struct phr_header headers[100];
        size_t prevbuflen = 0, method_len, path_len, num_headers;
            
        /* parse the request */
        num_headers = sizeof(headers) / sizeof(headers[0]);
        pret = phr_parse_request(buffer, bytes_read, &method, &method_len, &path, &path_len,
                                &minor_version, headers, &num_headers, prevbuflen);

        // PRINT THE HTTP MESSAGE 
        printf("request is %d bytes long\n", pret);
        printf("Received a %.*s Request.\n", (int)method_len, method);
        printf("path is %.*s\n", (int)path_len, path);
        printf("HTTP version is 1.%d\n", minor_version);
        printf("headers:\n");
        for (size_t i = 0; i != num_headers; ++i) {
            printf("%.*s: %.*s\n", (int)headers[i].name_len, headers[i].name,
                  (int)headers[i].value_len, headers[i].value);
        }

        // respond to the message 
        const char * response;
        int response_size; 

        HTTP_RESPONSE r;

        // Extract the method name and URL path from the parser's output 
        const char * method_name = extract_substring(method,0,method_len);
        const char * relative_path = extract_substring(path,0,path_len);

        printf("Method name: %s\n relative path: %s\n", method_name, relative_path);

        // Generate the HTTP_RESPONSE object based on the above parameters 
        generate_response(&r, method_name, relative_path); 

        // Flatten the response object into a string 
        response_size = flatten_response_object(&response, &r);

        printf("\n\nSending Response (%d bytes):\n%s", response_size, response);

        // send the response to the Load Balancer 
        send(headfd, response, response_size, 0); 

        // cleanup 
        free((void*)response); 
        free((void*)method_name); 
        free((void*)relative_path); 

        close(headfd); 
        exit(0);
    }
}

int main(){

    server Server; 

    create_server(&Server);
    run_server(&Server);
    
    return 0; 
}