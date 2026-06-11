package profile

import "time"

type ProfileDocument struct {
	ID        string    `json:"id" db:"id"`
	ProfileID string    `json:"profileId" db:"profile_id"`
	Name      string    `json:"name" db:"name"`
	URL       string    `json:"url" db:"url"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type GalleryItem struct {
	ID        string    `json:"id" db:"id"`
	ProfileID string    `json:"profileId" db:"profile_id"`
	ImageURL  string    `json:"imageUrl" db:"image_url"`
	Caption   string    `json:"caption" db:"caption"`
	Tags      []string  `json:"tags" db:"tags"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type Profile struct {
	ID          string            `json:"id" db:"id"`
	Name        string            `json:"name" db:"name" binding:"required"`
	Bio         string            `json:"bio" db:"bio"`
	Skills      []string          `json:"skills" db:"skills"`
	AvatarURL   string            `json:"avatarUrl" db:"avatar_url"`
	Documents   []ProfileDocument `json:"documents"`
	Gallery     []GalleryItem     `json:"gallery"`
	UpdatedAt   time.Time         `json:"updatedAt" db:"updated_at"`
}
