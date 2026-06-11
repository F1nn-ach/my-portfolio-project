package deployment

import "time"

type Deployment struct {
	ID        string    `json:"id" db:"id"`
	ProjectID string    `json:"projectId" db:"project_id"`
	Status    string    `json:"status" db:"status"`
	Logs      string    `json:"logs" db:"logs"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}
