package controller

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/dzahariev/taskboard/api/model"
	"github.com/gofrs/uuid/v5"
	"github.com/gorilla/mux"
)

// CreateTask is caled to create an task
func (server *Server) CreateTask(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		server.ERROR(w, http.StatusUnprocessableEntity, err)
		return
	}

	task := model.Task{}
	err = json.Unmarshal(body, &task)
	if err != nil {
		server.ERROR(w, http.StatusUnprocessableEntity, err)
		return
	}

	err = task.Validate()
	if err != nil {
		server.ERROR(w, http.StatusUnprocessableEntity, err)
		return
	}

	err = task.Save()

	if err != nil {
		server.ERROR(w, http.StatusInternalServerError, err)
		return
	}

	w.Header().Set("Location", fmt.Sprintf("%s%s/%d", r.Host, r.RequestURI, task.ID))
	server.JSON(w, http.StatusCreated, task)
}

// GetTasks retrieves all tasks
func (server *Server) GetTasks(w http.ResponseWriter, r *http.Request) {
	var err error
	task := model.Task{}
	count, err := task.Count()
	if err != nil {
		server.ERROR(w, http.StatusInternalServerError, err)
		return
	}

	data, err := task.FindAll()
	if err != nil {
		server.ERROR(w, http.StatusInternalServerError, err)
		return
	}

	list := model.List{
		Count: count,
		Data:  *data,
	}

	server.JSON(w, http.StatusOK, list)
}

// GetTask loads an task by given ID
func (server *Server) GetTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uid, err := uuid.FromString(vars["id"])
	if err != nil {
		server.ERROR(w, http.StatusBadRequest, err)
		return
	}
	task := model.Task{
		ID: uid,
	}
	err = task.Load()
	if err != nil {
		server.ERROR(w, http.StatusNotFound, err)
		return
	}
	server.JSON(w, http.StatusOK, task)
}

// UpdateTask updates existing task
func (server *Server) UpdateTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uid, err := uuid.FromString(vars["id"])
	if err != nil {
		server.ERROR(w, http.StatusBadRequest, err)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		server.ERROR(w, http.StatusUnprocessableEntity, err)
		return
	}

	task := model.Task{}
	err = json.Unmarshal(body, &task)
	if err != nil {
		server.ERROR(w, http.StatusUnprocessableEntity, err)
		return
	}

	err = task.Validate()
	if err != nil {
		server.ERROR(w, http.StatusUnprocessableEntity, err)
		return
	}

	task.ID = uid

	err = task.Update()
	if err != nil {
		server.ERROR(w, http.StatusInternalServerError, err)
		return
	}
	server.JSON(w, http.StatusOK, task)
}

// DeleteTask deletes an task
func (server *Server) DeleteTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	task := model.Task{}

	uid, err := uuid.FromString(vars["id"])
	if err != nil {
		server.ERROR(w, http.StatusBadRequest, err)
		return
	}

	task.ID = uid
	err = task.Load()
	if err != nil {
		server.ERROR(w, http.StatusNotFound, err)
		return
	}

	err = task.Delete()
	if err != nil {
		server.ERROR(w, http.StatusInternalServerError, err)
		return
	}

	w.Header().Set("Entity", fmt.Sprintf("%s", uid))
	server.JSON(w, http.StatusNoContent, "")
}
