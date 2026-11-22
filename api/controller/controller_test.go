package controller

import (
	"context"
	"net"
	"net/http"
	"testing"
	"time"

	"github.com/gorilla/mux"
)

func TestServeCompletesInFlightRequestOnShutdown(t *testing.T) {
	requestStarted := make(chan struct{})
	router := mux.NewRouter()
	router.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
		close(requestStarted)
		time.Sleep(300 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
	})
	server := &Server{Router: router}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	url := "http://" + listener.Addr().String() + "/slow"

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	serveDone := make(chan error, 1)
	go func() {
		serveDone <- server.Serve(ctx, listener)
	}()

	type result struct {
		status int
		err    error
	}
	requestDone := make(chan result, 1)
	go func() {
		resp, err := http.Get(url)
		if err != nil {
			requestDone <- result{err: err}
			return
		}
		resp.Body.Close()
		requestDone <- result{status: resp.StatusCode}
	}()

	<-requestStarted
	cancel()

	res := <-requestDone
	if res.err != nil {
		t.Fatalf("in-flight request failed during shutdown: %v", res.err)
	}
	if res.status != http.StatusOK {
		t.Fatalf("expected status 200, got %d", res.status)
	}

	select {
	case err := <-serveDone:
		if err != nil {
			t.Fatalf("expected clean shutdown, got %v", err)
		}
	case <-time.After(shutdownTimeout):
		t.Fatal("Serve did not return after shutdown")
	}

	if _, err := http.Get(url); err == nil {
		t.Fatal("expected new connections to be refused after shutdown")
	}
}
