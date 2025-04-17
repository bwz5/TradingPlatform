# Compiler and flags
CC     = gcc
CFLAGS = -Wall -Wextra -std=c11

ifdef SECURE 
	CFLAGS += -DHTTPS_SUPPORT -I/opt/homebrew/opt/openssl@3/include -L/opt/homebrew/opt/openssl@3/lib -lssl -lcrypto
endif 

# Target names 
HEAD_TARGET = head 

# Object files
HEAD_OBJS = src/load_balancer/main_head.o \
			src/load_balancer/head.o

##### HEAD (LOAD BALANCER). Uses standard HTTP #####
# Compile head into an executable 
$(HEAD_TARGET): $(HEAD_OBJS)
	$(CC) $(CFLAGS) -o $@ $(HEAD_OBJS)

# Compile head.c -> head.o
src/load_balancer/head.o: src/load_balancer/head.c src/load_balancer/head.h
	$(CC) $(CFLAGS) -c $< -o $@

# Compile main.c -> main_head.o
src/load_balancer/main_head.o: src/load_balancer/main.c
	$(CC) $(CFLAGS) -c $< -o $@

# Clean up build artifacts
clean:
	rm -f $(HEAD_OBJS) $(HEAD_TARGET)

# Explicitly define phony targets (not associated with files)
.PHONY: clean