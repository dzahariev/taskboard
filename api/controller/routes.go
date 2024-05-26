package controller

import "fmt"

const (
	PUBLIC = "public"
	READ   = "read"
	WRITE  = "write"

	// Resources
	task = "task"

	// Verbs
	GET    = "GET"
	POST   = "POST"
	PUT    = "PUT"
	DELETE = "DELETE"
)

func (s *Server) initializeRoutes() {
	// Task routes
	s.Router.HandleFunc(fmt.Sprintf("%s%s", s.APIPath, task), s.Protected(s.ContentTypeJSON(s.CreateTask), task, WRITE)).Methods(POST)
	s.Router.HandleFunc(fmt.Sprintf("%s%s", s.APIPath, task), s.Protected(s.ContentTypeJSON(s.GetTasks), task, READ)).Methods(GET)
	s.Router.HandleFunc(fmt.Sprintf("%s%s/{id}", s.APIPath, task), s.Protected(s.ContentTypeJSON(s.GetTask), task, READ)).Methods(GET)
	s.Router.HandleFunc(fmt.Sprintf("%s%s/{id}", s.APIPath, task), s.Protected(s.ContentTypeJSON(s.UpdateTask), task, WRITE)).Methods(PUT)
	s.Router.HandleFunc(fmt.Sprintf("%s%s/{id}", s.APIPath, task), s.Protected(s.ContentTypeJSON(s.DeleteTask), task, WRITE)).Methods(DELETE)

	// Static Route
	s.Router.PathPrefix("/").Handler(s.Static())
}
