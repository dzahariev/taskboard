package controller

import "fmt"

const (
	PUBLIC = "public"
	READ   = "read"
	WRITE  = "write"

	// Resources
	configuration = "configuration"
	task          = "task"

	// Verbs
	GET    = "GET"
	POST   = "POST"
	PUT    = "PUT"
	DELETE = "DELETE"
)

func (s *Server) initializeRoutes() {
	// Configuration routes
	s.Router.HandleFunc(fmt.Sprintf("/api/%s", configuration), s.Protected(s.ContentTypeJSON(s.GetConfiguration), configuration, READ)).Methods(GET)

	// Task routes
	s.Router.HandleFunc(fmt.Sprintf("/api/%s", task), s.Protected(s.ContentTypeJSON(s.CreateTask), task, WRITE)).Methods(POST)
	s.Router.HandleFunc(fmt.Sprintf("/api/%s", task), s.Protected(s.ContentTypeJSON(s.GetTasks), task, READ)).Methods(GET)
	s.Router.HandleFunc(fmt.Sprintf("/api/%s/{id}", task), s.Protected(s.ContentTypeJSON(s.GetTask), task, READ)).Methods(GET)
	s.Router.HandleFunc(fmt.Sprintf("/api/%s/{id}", task), s.Protected(s.ContentTypeJSON(s.UpdateTask), task, WRITE)).Methods(PUT)
	s.Router.HandleFunc(fmt.Sprintf("/api/%s/{id}", task), s.Protected(s.ContentTypeJSON(s.DeleteTask), task, WRITE)).Methods(DELETE)

	// Static Route
	s.Router.PathPrefix("/").Handler(s.Static())
}
