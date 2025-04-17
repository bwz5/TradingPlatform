#include "http_response.h"
#include <stdlib.h>
#include <string.h>

int flatten_response_object(const char ** response, HTTP_RESPONSE * http_response){
    // Calculate buffer length
    int buffer_len = strlen(http_response->version) + 1 +   // space separator
                     strlen(http_response->status_code) + 1 + 
                     strlen(http_response->headers) + 4 + // TODO: CRLF only accounts for ONE HEADER PLUS the blank line after
                     strlen(http_response->reason_phrase) + 2 + // CRLF after status line
                     strlen(http_response->body_buffer);
    
    // Allocate memory for the complete response
    *response = (char *)malloc(buffer_len + 1);  // +1 for null terminator
    if (*response == NULL) {
        perror("malloc failed");
        return -1;
    }

    // Construct the response string.
    int written = sprintf(*response, "%s %s %s\r\n%s\r\n\r\n%s", // carriage return for HTTP formatting 
        http_response->version, 
        http_response->status_code, 
        http_response->reason_phrase, 
        http_response->headers, 
        http_response->body_buffer);

    return written;
}

void generate_404(HTTP_RESPONSE * hr){
    hr->version = "HTTP/1.1";
    hr->status_code = "404"; 
    hr->reason_phrase = "Not Found";

    hr->headers="Content-Type: text/html; charset=UTF-8";

    // begin the HTML Body 
    DOCTYPE;
    HTML("en") {
        HEAD() {
        META("charset='utf-8'");
        META("name='viewport' "
                "content='width=device-width, initial-scale=1'");
        TITLE("Index page");
        META("name='description' content='Description'");
        META("name='author' content='Author'");
        META("property='og:title' content='Title'");
        }
        BODY("") {
            H1("") {
                _("404: Page not found");
            }
            P("Please ensure the url you entered was correct.");
        }
    }
}

void generate_home(HTTP_RESPONSE * hr){
    hr->version = "HTTP/1.1";
    hr->status_code = "200"; 
    hr->reason_phrase = "OK";

    hr->headers="Content-Type: text/html; charset=UTF-8";

    // begin the HTML Body 
    DOCTYPE;
    HTML("en") {
        HEAD() {
        META("charset='utf-8'");
        META("name='viewport' "
                "content='width=device-width, initial-scale=1'");
        TITLE("Index page");
        META("name='description' content='Description'");
        META("name='author' content='Author'");
        META("property='og:title' content='Title'");
        }
        BODY("") {
            H1("") {
                _("Welcome to the Home Page!");
            }
            P("This site was created by Benjamin Zou.");
        }
    }
}

void generate_response(HTTP_RESPONSE * hr, const char * method_name, const char * relative_path){
    if (!strcmp(method_name, "GET")){
          if (!strcmp(relative_path, "/")){
            generate_home(hr);
          } else {
            generate_404(hr);
          } 
    }

    if (!strcmp(method_name, "POST")){
          if (!strcmp(relative_path, "/api/trades")){
            generate_home(hr);
          } else {
            generate_404(hr);
          } 
    }
}