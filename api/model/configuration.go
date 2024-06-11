package model

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

// Configuration
type Configuration struct {
	Kinds []Kind `json:"kinds"`
}

// Kind
type Kind struct {
	Name    string   `json:"name"`
	Presets []Preset `json:"presets"`
}

// Preset
type Preset struct {
	Name string `json:"name"`
	Key  string `json:"key"`
}

func (c *Configuration) fileName() string {
	fileName := fmt.Sprintf("%s/%s", TASKS_PATH, "configuration.json")
	fileName = filepath.FromSlash(fileName)
	return fileName
}

// Load returns an object
func (c *Configuration) Load() error {
	if _, err := os.Stat(c.fileName()); errors.Is(err, fs.ErrNotExist) {
		return fmt.Errorf("not found")
	} else {
		fileContent, err := os.ReadFile(c.fileName())
		if err != nil {
			return fmt.Errorf("file cannot be read: %s", c.fileName())
		}
		var configuration Configuration
		err = json.Unmarshal(fileContent, &configuration)
		if err != nil {
			return fmt.Errorf("file cannot be parsed: %s", c.fileName())
		}
		c.Kinds = configuration.Kinds
		return nil
	}
}
