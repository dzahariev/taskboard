package model

// List holds technical fields
type List struct {
	Count int64  `json:"count"`
	Data  []Task `json:"data"`
}
