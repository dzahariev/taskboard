package controller

import (
	"net/http"

	"github.com/dzahariev/taskboard/api/model"
)

// GetConfiguration retrieves the configuration
func (server *Server) GetConfiguration(w http.ResponseWriter, r *http.Request) {
	configuration := model.Configuration{}
	err := configuration.Load()
	if err != nil {
		server.ERROR(w, http.StatusNotFound, err)
		return
	}
	server.JSON(w, http.StatusOK, configuration)
}
