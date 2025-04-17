#ifndef HTTP_RESPONSE_H
#define HTTP_RESPONSE_H

#include <stdio.h> 
#include "html_tags.h"

#define HTML_RESPONSE_SIZE 4096 

typedef struct {
    // Message Status-Line
    const char * version; 
    const char * status_code; 
    const char * reason_phrase; 

    const char * headers; 

    // Body 
    char body_buffer[HTML_RESPONSE_SIZE];
} HTTP_RESPONSE; 

/* 
Returns a C-string of the HTTP_RESPONSE
*/
int flatten_response_object(const char ** response, HTTP_RESPONSE * http_response); 

/*
Generates the HTTP_RESPONSE object 
*/
void generate_response(HTTP_RESPONSE * hr,const char * method_name, const char * relative_path );

#endif 