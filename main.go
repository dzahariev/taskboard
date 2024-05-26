package main

import (
	"fmt"
	"os"

	"github.com/dzahariev/taskboard/api/controller"
)

var server = controller.Server{}

func main() {
	// Auth configuration
	authURL := os.Getenv("AUTH_URL")
	authRealm := os.Getenv("AUTH_REALM")
	authClientID := os.Getenv("AUTH_CLIENT_ID")
	authClientSecret := os.Getenv("AUTH_CLIENT_SECRET")

	// Server configuration
	apiPort := os.Getenv("API_PORT")
	apiPath := os.Getenv("API_PATH")

	server.Initialize(authURL, authRealm, authClientID, authClientSecret, apiPort, apiPath)
	server.Run(fmt.Sprintf(":%s", apiPort))
}
