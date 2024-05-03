package controller

import (
	"log"
	"net/http"

	"github.com/dzahariev/taskboard/api/security"
	"github.com/gorilla/mux"
)

// Server represent current API server
type Server struct {
	Router     *mux.Router
	AuthClient *security.AuthClient
	APIPath    string
	APIPort    string
}

// AuthInitialize is used to register routes
func (server *Server) AuthInitialize(authURL, authRealm, authClientID, authClientSecret string) {
	server.AuthClient = &security.AuthClient{}
	server.AuthClient.Initialize(authURL, authRealm, authClientID, authClientSecret)
}

// RoutesInitialize is used to register routes
func (server *Server) RoutesInitialize() {
	server.Router = mux.NewRouter()
	server.initializeRoutes()
}

// Initialize is used to init a DB cnnection and register routes
func (server *Server) Initialize(authURL, authRealm, authClientID, authClientSecret, apiPort, apiPath string) {
	server.AuthInitialize(authURL, authRealm, authClientID, authClientSecret)
	server.APIPort = apiPort
	server.APIPath = apiPath
	server.RoutesInitialize()
}

// Run starts the http server
func (server *Server) Run(addr string) {
	log.Printf("Listening to port %s", server.APIPort)
	log.Fatal(http.ListenAndServe(addr, server.Router))
}
