APP_NAME=taskboard

all: build 

build: clean 
	@echo "----------------------------------------------------------" 
	@echo "Building $(APP_NAME)" 
	@echo "----------------------------------------------------------" 
	@go build -o $(APP_NAME)

format:
	@echo "----------------------------------------------------------" 
	@echo "Formatting code" 
	@echo "----------------------------------------------------------" 
	@go fmt ./...

clean: 
	@echo "----------------------------------------------------------" 
	@echo "Cleaning" 
	@echo "----------------------------------------------------------" 
	@go clean
	@rm -fr $(APP_NAME)
	@rm -fr public/*
	@rm -fr ui/dist
	@rm -fr ui/package-lock.json
	@rm -fr ui/node_modules

docker: 
	@echo "----------------------------------------------------------" 
	@echo "Build docker image" 
	@echo "----------------------------------------------------------" 
	@docker build -t $(APP_NAME) .

docker-nc: 
	@echo "----------------------------------------------------------" 
	@echo "Build docker image without caching" 
	@echo "----------------------------------------------------------" 
	@docker build --no-cache -t $(APP_NAME) .