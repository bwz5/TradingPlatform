#include "head.h"

int create_server(SERVER_CONNECTION *sc, const char *ip, int port)
{
    sc->IP   = strdup(ip);
    sc->port = port;

    sc->serverfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sc->serverfd < 0) {
        perror("socket");
        free((void*)sc->IP);
        return -1;
    }

    memset(&sc->server_addr, 0, sizeof(sc->server_addr));
    sc->server_addr.sin_family = AF_INET;
    sc->server_addr.sin_port   = htons(port);

    if (inet_pton(AF_INET, ip, &sc->server_addr.sin_addr) <= 0) {
        fprintf(stderr, "Invalid address %s\n", ip);
        goto fail;
    }
    if (connect(sc->serverfd,
                (struct sockaddr *)&sc->server_addr,
                sizeof(sc->server_addr)) < 0) {
        perror("connect");
        goto fail;
    }

    sc->weight = MEDIUM_WEIGHT;
    return 0;

fail:
    free((void*)sc->IP);
    close(sc->serverfd);
    return -1;
}


void create_head(HEAD *s)
{
    s->socketfd = socket(AF_INET, SOCK_STREAM, 0);
    if (s->socketfd < 0) { perror("socket"); exit(EXIT_FAILURE); }

    memset(&s->server_address, 0, sizeof(s->server_address));
    inet_aton(SERVER_IP, &s->server_address.sin_addr);
    s->server_address.sin_port   = htons(SERVER_PORT_NUMBER);
    s->server_address.sin_family = AF_INET;

    if (bind(s->socketfd,
             (struct sockaddr *)&s->server_address,
             sizeof(s->server_address)) < 0) {
        perror("bind");
        exit(EXIT_FAILURE);
    }

    printf("LoadBalancer Head listening on %s:%d\n",
           SERVER_IP, SERVER_PORT_NUMBER);

    pthread_mutex_init(&s->connections_mutex, NULL);

    s->server_connections = calloc(MAX_SERVER_CONNECTIONS,
                                   sizeof(SERVER_CONNECTION));
    s->current_weights    = calloc(MAX_SERVER_CONNECTIONS, sizeof(int));

    if (!s->server_connections || !s->current_weights) {
        fprintf(stderr, "malloc failed\n");
        exit(EXIT_FAILURE);
    }
    s->num_connections    = 0;
    s->static_weight_sum  = 0;
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

void *run_head(void *arg) {
    HEAD *s = (HEAD *)arg;

    if (listen(s->socketfd, MAX_BACKLOG) < 0) {
        perror("listen");
        exit(EXIT_FAILURE);
    }

    for (;;) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        int clientfd = accept(
            s->socketfd,
            (struct sockaddr *)&client_addr,
            &client_len
        );
        if (clientfd < 0) {
            perror("accept");
            continue;
        }

        pid_t pid = fork();
        if (pid != 0) {
            /* Parent just closes client socket and loops */
            close(clientfd);
            continue;
        }

        /* ---- Child handles one request-response cycle ---- */
        char buffer[8192];
        ssize_t n;

        int chosen_idx = 0;

        // smooth weighted round robin selection
        int current_max = INT32_MIN;
        pthread_mutex_lock(&s->connections_mutex);
        for (unsigned i = 0; i < s->num_connections; ++i) {
            s->current_weights[i] += s->server_connections[i].weight;
            if (s->current_weights[i] > current_max) {
                current_max = s->current_weights[i];
                chosen_idx  = i;
            }
        }
        s->current_weights[chosen_idx] -= s->static_weight_sum;
        pthread_mutex_unlock(&s->connections_mutex);
        

        SERVER_CONNECTION *backend = &s->server_connections[chosen_idx];

        // Open a fresh socket to the chosen backend 
        int backendfd = socket(AF_INET, SOCK_STREAM, 0);
        if (backendfd < 0) {
            perror("socket->backend");
            close(clientfd);
            exit(EXIT_FAILURE);
        }

        struct sockaddr_in be_addr = {0};
        be_addr.sin_family = AF_INET;
        be_addr.sin_port   = htons(backend->port);
        if (inet_pton(AF_INET, backend->IP, &be_addr.sin_addr) <= 0) {
            fprintf(stderr, "Invalid backend IP %s\n", backend->IP);
            close(backendfd);
            close(clientfd);
            exit(EXIT_FAILURE);
        }

        if (connect(backendfd, (struct sockaddr *)&be_addr, sizeof(be_addr)) < 0) {
            perror("connect->backend");
            close(backendfd);
            close(clientfd);
            exit(EXIT_FAILURE);
        }

        // Proxy entire client request to backend 
        while ((n = recv(clientfd, buffer, sizeof(buffer), 0)) > 0) {
            if (send(backendfd, buffer, n, 0) != n) {
                perror("send->backend");
                break;
            }
        }

        // Proxy entire backend response back to client 
        while ((n = recv(backendfd, buffer, sizeof(buffer), 0)) > 0) {
            if (send(clientfd, buffer, n, 0) != n) {
                perror("send->client");
                break;
            }
        }

        // cleanup 
        close(backendfd);
        close(clientfd);
        exit(EXIT_SUCCESS);
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