package project

import "time"

type ProjectDocument struct {
	ID        string    `json:"id" db:"id"`
	ProjectID string    `json:"projectId" db:"project_id"`
	Name      string    `json:"name" db:"name"`
	URL       string    `json:"url" db:"url"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type Project struct {
	ID           string            `json:"id" db:"id"`
	Title        string            `json:"title" db:"title" binding:"required"`
	Description  string            `json:"description" db:"description"`
	Tech         []string          `json:"tech" db:"tech"`
	VideoURL     string            `json:"videoUrl" db:"video_url"`
	DemoURL      string            `json:"demoUrl" db:"demo_url"`
	GitURL       string            `json:"gitUrl" db:"git_url"`
	Status       string            `json:"status" db:"status"`
	DeploysCount int               `json:"deploysCount" db:"deploys_count"`
	IsVisible    bool              `json:"isVisible" db:"is_visible"`
	Documents    []ProjectDocument `json:"documents"`
	CreatedAt    time.Time         `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time         `json:"updatedAt" db:"updated_at"`
}
