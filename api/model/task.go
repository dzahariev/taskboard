package model

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path"
	"path/filepath"

	"github.com/gofrs/uuid/v5"
)

const (
	TASKS_PATH = "./tasks"
)

// Task
type Task struct {
	ID       uuid.UUID `json:"id"`
	Status   string    `json:"status"`
	Progress string    `json:"progress"`
	Kind     string    `json:"kind"`
	Source   string    `json:"source"`
	Preset   string    `json:"preset"`
}

// Count returns count of all known objects of this type
func (t *Task) Count() (int64, error) {
	// TODO
	return 0, nil
}

func (t *Task) fileName() string {
	fileName := fmt.Sprintf("%s/%s.%s", TASKS_PATH, t.ID.String(), "json")
	fileName = filepath.FromSlash(fileName)
	return fileName
}

// Load returns an object
func (t *Task) Load() error {
	if _, err := os.Stat(t.fileName()); errors.Is(err, fs.ErrNotExist) {
		return fmt.Errorf("not found")
	} else {
		fileContent, err := os.ReadFile(t.fileName())
		if err != nil {
			return fmt.Errorf("file cannot be read: %s", t.fileName())
		}
		var currentTask Task
		err = json.Unmarshal(fileContent, &currentTask)
		if err != nil {
			return fmt.Errorf("file cannot be parsed: %s", t.fileName())
		}
		t.ID = currentTask.ID
		t.Status = currentTask.Status
		t.Progress = currentTask.Progress
		t.Kind = currentTask.Kind
		t.Source = currentTask.Source
		t.Preset = currentTask.Preset
		return nil
	}
}

// Delete is removing existing objects
func (t *Task) Delete() error {
	if _, err := os.Stat(t.fileName()); errors.Is(err, fs.ErrNotExist) {
		return fmt.Errorf("not found")
	} else {
		err := os.Remove(t.fileName())
		if err != nil {
			return fmt.Errorf("file cannot be deleted: %s", t.fileName())
		}
		return nil
	}
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
	return t.saveInternal()
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
	return t.saveInternal()
}

func (t *Task) saveInternal() error {
	bytes, err := json.Marshal(t)
	if err != nil {
		return fmt.Errorf("task cannot be serialized")
	}
	err = os.WriteFile(t.fileName(), bytes, 0644)
	if err != nil {
		return fmt.Errorf("cannot write to file")
	}
	return nil
}
