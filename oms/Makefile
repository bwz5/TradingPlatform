# Compiler and flags
CC     = gcc
CFLAGS = -Wall -Wextra -std=c11

# Target names 
SERVER_TARGET = server

# Object files
SERVER_OBJS = src/main.o \
	   lib/http_parser.o \
	   src/http_response.o

###### SERVER SIDE ######

# Link all object files into the final executable
$(SERVER_TARGET): $(SERVER_OBJS)
	$(CC) $(CFLAGS) -o $@ $(SERVER_OBJS)

# Compile http_parser.c -> http_parser.o
lib/http_parser.o: lib/picohttpparser.c lib/picohttpparser.h
	$(CC) $(CFLAGS) -c $< -o $@

# Compile http_response.c -> http_response.o
src/http_response.o: src/http_response.c src/http_response.h src/html_tags.h src/json_tags.h
	$(CC) $(CFLAGS) -c $< -o $@

# Compile server.c -> server.o
src/main.o: src/server.c
	$(CC) $(CFLAGS) -c $< -o $@

# Clean up build artifacts
clean:
	rm -f $(SERVER_OBJS) $(SERVER_TARGET)

# Explicitly define phony targets (not associated with files)
.PHONY: clean
