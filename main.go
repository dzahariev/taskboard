package main

import (
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

	server.Initialize(authURL, authRealm, authClientID, authClientSecret)
	server.Run(":8800")
}
