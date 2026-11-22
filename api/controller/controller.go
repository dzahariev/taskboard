package controller

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dzahariev/taskboard/api/security"
	"github.com/gorilla/mux"
)

// shutdownTimeout stays below Docker's default 10s stop grace period
const shutdownTimeout = 8 * time.Second

// Server represent current API server
type Server struct {
	Router     *mux.Router
	AuthClient *security.AuthClient
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
func (server *Server) Initialize(authURL, authRealm, authClientID, authClientSecret string) {
	server.AuthInitialize(authURL, authRealm, authClientID, authClientSecret)
	server.RoutesInitialize()
}

// Run starts the http server and stops it gracefully on SIGINT or SIGTERM
func (server *Server) Run(addr string) {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	// Restore default signal handling once shutdown starts, so a second signal terminates immediately
	context.AfterFunc(ctx, stop)

	listener, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Listening on %s", addr)

	if err := server.Serve(ctx, listener); err != nil {
		log.Fatal(err)
	}
}

// Serve handles requests on the listener until ctx is cancelled, then waits for in-flight requests to complete
func (server *Server) Serve(ctx context.Context, listener net.Listener) error {
	httpServer := &http.Server{Handler: server.Router}

	serveErr := make(chan error, 1)
	go func() {
		serveErr <- httpServer.Serve(listener)
	}()

	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
	}

	log.Println("Shutting down, waiting for in-flight requests ...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		httpServer.Close()
		return fmt.Errorf("graceful shutdown failed: %w", err)
	}
	log.Println("Server stopped")
	return nil
}
