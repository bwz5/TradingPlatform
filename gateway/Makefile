# Compiler and flags
CC     = gcc
CFLAGS = -Wall -Wextra -std=c11 
HEAD_TARGET = head 

# Object files
HEAD_OBJS = src/main.o \
			src/head.o

# Compile head into an executable 
$(HEAD_TARGET): $(HEAD_OBJS)
	$(CC) $(CFLAGS) -o $@ $(HEAD_OBJS)

# Compile head.c -> head.o
src/head.o: src/head.c src/head.h
	$(CC) $(CFLAGS) -c $< -o $@

# Compile main.c -> main.o
src/main.o: src/main.c
	$(CC) $(CFLAGS) -c $< -o $@

# Clean up build artifacts
clean:
	rm -f $(HEAD_OBJS) $(HEAD_TARGET)

# Explicitly define phony targets (not associated with files)
.PHONY: clean