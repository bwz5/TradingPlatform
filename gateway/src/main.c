#include "head.h"
#include <pthread.h> 

HEAD head; // representation of a load balancer 

typedef enum {
    ADD_CONNECTION = 1,
    PRINT_CONNECTIONS = 2
} menu_options;

void cleanup_handler(void) {
    cleanup(&head); 
}

void add_connection(HEAD * h){
    printf("Please enter the IP of the server you wish to add to the network in the format of: \nIP_ADDRESS PORT \n");
    char ip_buffer[100]; 
    int port; 

    scanf("%99s %d", ip_buffer, &port); // read 99 bytes to avoid buffer overflow
    add_server_connection(h, ip_buffer, port); 
}

void poll_terminal(HEAD* h){
    while(1){
        // print the MENU 
        printf("Please select an option from the list below:\n");

        printf("1. Add a server to the load balancing network.\n");
        printf("2. Print the current server connections in the network.\n");

        int user_option; 
        scanf("%d", &user_option); 

        switch(user_option){
            case ADD_CONNECTION:
                add_connection(h); 
                break; 
            case PRINT_CONNECTIONS:
                print_server_connections(h);
                break; 
            default:
                break; 
        }
    }
}

int main(){
    create_head(&head);

    if (atexit(cleanup_handler) != 0) {
        printf("atexit registration failed for the cleanup of our load balancer.\n");
        exit(EXIT_FAILURE);
    }

    printf("Welcome to the load balancing HTTP server, written entirely in C!\n\n"); 

    // need to run_head on a separate thread so we can 
    // add server connections via the terminal
    pthread_t run_head_thread; 

    if (pthread_create(&run_head_thread, NULL, run_head, (void*)&head) != 0) {
        perror("pthread_create failed");
        exit(EXIT_FAILURE);
    }

    poll_terminal(&head);
    
    // Wait for the created thread to finish execution
    if (pthread_join(run_head_thread, NULL) != 0) {
        perror("pthread_join failed");
        exit(EXIT_FAILURE);
    }

    cleanup(&head);
    
    return 0; 
}