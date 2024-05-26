package controller

import (
	"io"
	"net/http"
)

// Login is caled to login user
func (server *Server) Login(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		server.ERROR(w, http.StatusUnprocessableEntity, err)
		return
	}

	server.JSON(w, http.StatusCreated, body)
}
