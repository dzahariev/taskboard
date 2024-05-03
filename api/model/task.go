package model

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path"

	"github.com/gofrs/uuid/v5"
)

const (
	TASKS_PATH = "./tasks"
)

// Task
type Task struct {
	ID         uuid.UUID         `json:"id"`
	Status     string            `json:"status"`
	Kind       string            `json:"kind"`
	Properties map[string]string `json:"properties"`
}

// Count returns count of all known objects of this type
func (t *Task) Count() (int64, error) {
	// TODO
	return 0, nil
}

// FindByID returns an objects with corresponding ID if exists
func (t *Task) FindByID(uid uuid.UUID) error {
	// TODO
	return nil
}

// Delete is removing existing objects
func (t *Task) Delete() error {
	// TODO
	return nil
}

// Save saves the structure as new object
func (t *Task) Save() error {
	err := t.Prepare()
	if err != nil {
		return err
	}

	err = t.Validate()
	if err != nil {
		return err
	}

	// TODO Create object
	return nil
}

// Validate checks structure consistency
func (t *Task) Validate() error {
	if t.Status == "" {
		return fmt.Errorf("required Status")
	}
	if t.Kind == "" {
		return fmt.Errorf("required Kind")
	}

	return nil
}

func (t *Task) Prepare() error {
	uuid, err := uuid.NewV4()
	if err != nil {
		return err
	}

	t.ID = uuid
	return nil
}

// FindAll returns all known objects of this type
func (t *Task) FindAll() (*[]Task, error) {
	tasks := []Task{}

	files, err := os.ReadDir(TASKS_PATH)
	if err != nil {
		panic(err)
	}

	for _, file := range files {
		if file.Type().IsRegular() {
			fileExtension := path.Ext(file.Name())
			if fileExtension == ".json" {
				var currentTask Task
				fileContent, err := os.ReadFile(fmt.Sprintf("%s/%s", TASKS_PATH, file.Name()))
				if err != nil {
					log.Printf("File cannot be read - ignoring file: %s", file.Name())
				}
				err = json.Unmarshal(fileContent, &currentTask)
				if err != nil {
					log.Printf("File cannot be parsed - ignoring file: %s", file.Name())
				}
				tasks = append(tasks, currentTask)
			}
		}
	}
	return &tasks, nil
}

// Update updates the existing objects
func (t *Task) Update() error {
	if t.ID == uuid.Nil {
		return fmt.Errorf("cannot update non saved Task")
	}

	err := t.Validate()
	if err != nil {
		return err
	}

	// TODO Update

	return nil
}
