#include "head.h"

int create_server(SERVER_CONNECTION * sc, const char * ip, int port){
    sc->IP = strdup(ip);
    sc->port = port;
    
    sc->serverfd = socket(AF_INET, SOCK_STREAM, 0);

    if (sc->serverfd < 0){
        printf("Error creating the socket for the server connection.\n");
        free((void*)sc->IP); 
        return -1; 
    }

    sc->server_addr.sin_family = AF_INET; 
    sc->server_addr.sin_port = htons(port); 

    if (inet_pton(AF_INET, ip, &sc->server_addr.sin_addr) <= 0) {
        printf("Invalid address/Address not supported\n");
        free((void*)sc->IP);
        close(sc->serverfd); 
        return -1; 
    }

    if (connect(sc->serverfd, (struct sockaddr *)&sc->server_addr, sizeof(sc->server_addr)) < 0){
        printf("Connection failed\n");
        free((void*)sc->IP);
        close(sc->serverfd);
        return -1; 
    }

    sc->weight = MEDIUM_WEIGHT; // TODO: Change weight later based on real info (CPU probably best)

    return 0;
}

void create_head(HEAD * s){
    #ifdef HTTPS_SUPPORT
        SSL_library_init();
        OpenSSL_add_all_algorithms();
        SSL_load_error_strings();

        s->ctx =  SSL_CTX_new(TLS_server_method());
        if (s->ctx == NULL) {
            ERR_print_errors_fp(stderr);
            exit(EXIT_FAILURE);
        }

        if (SSL_CTX_use_certificate_file(s->ctx, "./security/server.crt", SSL_FILETYPE_PEM) <= 0 ||
            SSL_CTX_use_PrivateKey_file(s->ctx, "./security/server.key", SSL_FILETYPE_PEM) <= 0) {
            ERR_print_errors_fp(stderr);
            SSL_CTX_free(s->ctx);
            exit(EXIT_FAILURE);
        }
    #endif 
    s->socketfd = socket(AF_INET, SOCK_STREAM, 0); 

    inet_aton(SERVER_IP,(struct in_addr*)&s->server_address.sin_addr); 
    s->server_address.sin_port = htons(SERVER_PORT_NUMBER); 
    s->server_address.sin_family = AF_INET; 
    
    char ip_str[INET_ADDRSTRLEN];

    // Convert to text string 
    inet_ntop(AF_INET, &(s->server_address.sin_addr), ip_str, INET_ADDRSTRLEN);

    printf("LoadBalancer Head started on %s:%i\n", ip_str, SERVER_PORT_NUMBER);

    if (bind(s->socketfd, (struct sockaddr *)&s->server_address, sizeof(s->server_address)) < 0){
        printf("Failure to bind the socketfd with the sockaddr_in struct\n"); 
        #ifdef HTTPS_SUPPORT
            SSL_CTX_free(s->ctx);
        #endif 
        exit(-1); 
    }

    // connection initializations 

    pthread_mutex_init(&(s->connections_mutex), NULL); 

    s->server_connections = (SERVER_CONNECTION *)malloc(sizeof(SERVER_CONNECTION) * MAX_SERVER_CONNECTIONS);
    s->current_weights = (int *)malloc(sizeof(int) * MAX_SERVER_CONNECTIONS);

    if (s->server_connections == NULL || s->current_weights == NULL){
        printf("Error using malloc, could not create load balancer.\n");
        #ifdef HTTPS_SUPPORT
            SSL_CTX_free(s->ctx);
        #endif 
        exit(-1); 
    }
    //memset here to initialize an all zero array, as we assume in the round robin calculation initial values of zero
    memset(s->current_weights, 0, MAX_SERVER_CONNECTIONS);

    s->num_connections = 0;

    // set the static weight sum to 0
    s->static_weight_sum = 0 ;
}

void add_server_connection(HEAD * s, const char * IP, int port){
    // create the server object 
    SERVER_CONNECTION * sc = (SERVER_CONNECTION*)malloc(sizeof(SERVER_CONNECTION));
    int success = create_server(sc, IP, port); 

    if (success < 0){
        free(sc); 
        return; // could not create the server 
    }

    // add to the array
    pthread_mutex_lock(&s->connections_mutex);

    if (s->num_connections == MAX_SERVER_CONNECTIONS){
        printf("Cannot add another server, already at the max capacity\n");
        pthread_mutex_unlock(&s->connections_mutex);  // Unlock before returning
        return; 
    }

    s->server_connections[s->num_connections] = *sc; 
    s->num_connections += 1; 

    s->static_weight_sum += MEDIUM_WEIGHT; // TODO: Change this as well 
    pthread_mutex_unlock(&s->connections_mutex);
}

void print_server_connections(HEAD * s){
    pthread_mutex_lock(&s->connections_mutex);
    for (unsigned int i = 0; i < s->num_connections; i += 1){
        printf("Server connected on %s:%d\n",s->server_connections[i].IP, s->server_connections[i].port);
    }
    pthread_mutex_unlock(&s->connections_mutex);
}

void * run_head(void * arg){
    HEAD * s = (HEAD *)arg;
    // listen on the socketfd and set the maximum number of queued connections 
    if (listen(s->socketfd, MAX_BACKLOG ) < 0){
        printf("Failed to listen to the socket\n");
        exit(-1); 
    }

    int clientfd; 
    struct sockaddr_in client_addr; 
    socklen_t client_len = sizeof(client_addr); 

    while (1) {
        clientfd = accept(s->socketfd, (struct sockaddr *)&client_addr, (socklen_t *)&client_len);

        if (clientfd < 0){
            printf("Failed to connect to the client\n"); 
            exit(-1); 
        }
        
        // fork() here to continue listening for other connections 
        pid_t PID = fork(); 

        if (PID != 0){
            // parent
            close(clientfd); // avoid race conditions on the fd 
            continue; 
        }

        #ifdef HTTPS_SUPPORT
            s->ssl = SSL_new(s->ctx);
            SSL_set_fd(s->ssl, clientfd);

            // Perform the TLS handshake
            if (SSL_accept(s->ssl) <= 0) {
                ERR_print_errors_fp(stderr);
                SSL_free(s->ssl);
                close(clientfd);
                continue;
            }
        #endif 

        // handle the incoming request 
        char buffer[4096] = {0}; 
        size_t bytes_read; 

        #ifdef HTTPS_SUPPORT
            bytes_read = SSL_read(s->ssl, buffer, sizeof(buffer));       
        #else 
            bytes_read = recv(clientfd, buffer, sizeof(buffer), 0);
        #endif 
        if (bytes_read < 0) {
            printf("Error reading the clientfd\n"); 
            close(clientfd); // error on clientside or recv
            exit(-1); // need to exit because we are in the child 
        }

        printf("\nReceived from CLIENT: \n%s\n\n", buffer); 

        // SMOOTH WEIGHT ROUND ROBIN ALGORITHM
        int current_max_weight = -214748364; // very small integer 
        int chosen_idx = 0; 

        pthread_mutex_lock(&s->connections_mutex);
        for (unsigned int i = 0; i < s->num_connections; i+= 1){
            s->current_weights[i] = s->current_weights[i] + s->server_connections[i].weight; 

            if (current_max_weight < s->current_weights[i]){
                current_max_weight = s->current_weights[i];
                chosen_idx = i;
            }
        }
        // subtract total weights from our chosen index as last step of algorithm 
        s->current_weights[chosen_idx] -= s->static_weight_sum;
        pthread_mutex_unlock(&s->connections_mutex);

        // Send the request to the best available server 
        size_t bytes_sent = send(s->server_connections[chosen_idx].serverfd, buffer, bytes_read, 0);
        if (bytes_sent != bytes_read){
            printf("Error sending full message to the server.\n");
            exit(-1);
        }

        // accept a response from the server (will wait for a response)
        bytes_read = recv(s->server_connections[chosen_idx].serverfd, buffer, sizeof(buffer), 0);

        // send the response to the client 
        #ifdef HTTPS_SUPPORT
            bytes_sent = SSL_write(s->ssl, buffer, bytes_read);
        #else 
            bytes_sent = send(clientfd, buffer, bytes_read, 0);
        #endif 

        if (bytes_sent != bytes_read){
            printf("Error sending full message to the client.\n");
            exit(-1);
        }

        // cleanup 
        close(clientfd); 
        #ifdef HTTPS_SUPPORT
            SSL_shutdown(s->ssl);
            SSL_free(s->ssl);
        #endif 
        exit(0);
    }
}

void cleanup(HEAD * s){
    // free all of the server connections 
    pthread_mutex_lock(&s->connections_mutex);
    for (unsigned int i = 0; i < s->num_connections; i+= 1){
        free((void*)s->server_connections[i].IP);
    }

    free((void*)s->server_connections);

    free((void*)s->current_weights);
    pthread_mutex_unlock(&s->connections_mutex);

    pthread_mutex_destroy(&s->connections_mutex);
}