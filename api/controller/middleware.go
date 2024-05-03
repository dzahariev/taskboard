package controller

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"net/http"
	"strings"
)

// Wrapper for public resources
func (server *Server) Static() http.Handler {
	return http.FileServer(http.Dir("./public"))
}

func (server *Server) Public(next http.HandlerFunc) http.HandlerFunc {
	return server.Protected(next, PUBLIC, PUBLIC)
}

// Wrapper for protected resources
func (server *Server) Protected(next http.HandlerFunc, resource string, role string) http.HandlerFunc {
	protectedHandler := func(w http.ResponseWriter, r *http.Request) {
		if !strings.EqualFold(resource, PUBLIC) {
			// Parse token
			authHeader := r.Header.Get("Authorization")
			if len(authHeader) < 7 {
				server.ERROR(w, http.StatusUnauthorized, fmt.Errorf("unauthorized, missing bearer authorization header"))
				return
			}
			authType := strings.ToLower(authHeader[:6])
			if authType != "bearer" {
				server.ERROR(w, http.StatusUnauthorized, fmt.Errorf("unauthorized, invalid bearer authorization header"))
				return
			}

			// Verify token is valid
			tokenString := authHeader[7:]
			tokenString = strings.TrimSpace(tokenString)
			err := server.AuthClient.RetrospectToken(r.Context(), tokenString)
			if err != nil {
				server.ERROR(w, http.StatusUnauthorized, err)
				return
			}

			// Get roles from token
			roles, err := server.AuthClient.GetRolesFromToken(r.Context(), tokenString)
			if err != nil {
				server.ERROR(w, http.StatusUnauthorized, err)
				return
			}

			// Check permissions
			if server.havePermission(resource, role, roles) {
				next(w, r)
			} else {
				// lack of permissions
				server.ERROR(w, http.StatusUnauthorized, fmt.Errorf("unauthorized, no permissions"))
				return
			}
		} else {
			// NO authiorisation is required
			next(w, r)
		}
	}
	return server.logging(protectedHandler)
}

// ContentTypeJSON set the content type to JSON
func (server *Server) ContentTypeJSON(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next(w, r)
	}
}

// JSON returns data as JSON stream
func (server *Server) JSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.WriteHeader(statusCode)
	err := json.NewEncoder(w).Encode(data)
	if err != nil {
		fmt.Fprintf(w, "%s", err.Error())
	}
}

// ERROR returns error as JSON representation
func (server *Server) ERROR(w http.ResponseWriter, statusCode int, err error) {
	if err != nil {
		server.JSON(w, statusCode, struct {
			Error string `json:"error"`
		}{
			Error: err.Error(),
		})
		return
	}
	server.JSON(w, http.StatusBadRequest, nil)
}

func (server *Server) havePermission(resource, role string, roles []string) bool {
	for _, currentRole := range roles {
		resourceRole := fmt.Sprintf("%s.%s", resource, role)
		if strings.EqualFold(currentRole, resourceRole) {
			return true
		}
	}
	return false
}

func (server *Server) logging(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		req := fmt.Sprintf("%s %s", r.Method, r.URL)
		log.Println(req)
		next.ServeHTTP(w, r)
		log.Println(req, "execution time:", time.Since(start))
	}
}
