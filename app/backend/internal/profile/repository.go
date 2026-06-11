package profile

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const DefaultProfileID = "00000000-0000-0000-0000-000000000000"

type Repository interface {
	GetProfile(ctx context.Context) (*Profile, error)
	UpdateProfile(ctx context.Context, p *Profile) error
	AddProfileDocument(ctx context.Context, doc *ProfileDocument) error
	DeleteProfileDocument(ctx context.Context, id string) error
	AddGalleryItem(ctx context.Context, item *GalleryItem) error
	DeleteGalleryItem(ctx context.Context, id string) error
}

type postgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(pool *pgxpool.Pool) Repository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) GetProfile(ctx context.Context) (*Profile, error) {
	query := `SELECT id, name, bio, skills, avatar_url, updated_at 
	          FROM public.profiles 
	          WHERE id = $1`

	var p Profile
	err := r.pool.QueryRow(ctx, query, DefaultProfileID).Scan(
		&p.ID,
		&p.Name,
		&p.Bio,
		&p.Skills,
		&p.AvatarURL,
		&p.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			p = Profile{
				ID:          DefaultProfileID,
				Name:        "F1nn-ach",
				Bio:         "Developer Profile",
				Skills:      []string{},
				AvatarURL:   "",
				Documents:   []ProfileDocument{},
				Gallery:     []GalleryItem{},
			}
			insertQuery := `INSERT INTO public.profiles (id, name, bio, skills, avatar_url) 
			                VALUES ($1, $2, $3, $4, $5) 
			                RETURNING updated_at`
			err = r.pool.QueryRow(ctx, insertQuery, p.ID, p.Name, p.Bio, p.Skills, p.AvatarURL).Scan(&p.UpdatedAt)
			if err != nil {
				return nil, err
			}
			return &p, nil
		}
		return nil, err
	}

	// Fetch documents
	p.Documents = []ProfileDocument{}
	docQuery := `SELECT id, profile_id, name, url, created_at FROM public.profile_documents WHERE profile_id = $1 ORDER BY created_at DESC`
	docRows, err := r.pool.Query(ctx, docQuery, DefaultProfileID)
	if err == nil {
		defer docRows.Close()
		for docRows.Next() {
			var doc ProfileDocument
			if err := docRows.Scan(&doc.ID, &doc.ProfileID, &doc.Name, &doc.URL, &doc.CreatedAt); err == nil {
				p.Documents = append(p.Documents, doc)
			}
		}
	}

	// Fetch gallery
	p.Gallery = []GalleryItem{}
	galQuery := `SELECT id, profile_id, image_url, caption, tags, created_at FROM public.profile_gallery WHERE profile_id = $1 ORDER BY created_at DESC`
	galRows, err := r.pool.Query(ctx, galQuery, DefaultProfileID)
	if err == nil {
		defer galRows.Close()
		for galRows.Next() {
			var item GalleryItem
			if err := galRows.Scan(&item.ID, &item.ProfileID, &item.ImageURL, &item.Caption, &item.Tags, &item.CreatedAt); err == nil {
				p.Gallery = append(p.Gallery, item)
			}
		}
	}

	return &p, nil
}

func (r *postgresRepository) UpdateProfile(ctx context.Context, p *Profile) error {
	query := `UPDATE public.profiles 
	          SET name = $1, bio = $2, skills = $3, avatar_url = $4
	          WHERE id = $5 
	          RETURNING updated_at`

	if p.Skills == nil {
		p.Skills = []string{}
	}

	err := r.pool.QueryRow(
		ctx,
		query,
		p.Name,
		p.Bio,
		p.Skills,
		p.AvatarURL,
		DefaultProfileID,
	).Scan(&p.UpdatedAt)

	return err
}

func (r *postgresRepository) AddProfileDocument(ctx context.Context, doc *ProfileDocument) error {
	query := `INSERT INTO public.profile_documents (profile_id, name, url) 
	          VALUES ($1, $2, $3) 
	          RETURNING id, created_at`
	return r.pool.QueryRow(ctx, query, DefaultProfileID, doc.Name, doc.URL).Scan(&doc.ID, &doc.CreatedAt)
}

func (r *postgresRepository) DeleteProfileDocument(ctx context.Context, id string) error {
	query := `DELETE FROM public.profile_documents WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

func (r *postgresRepository) AddGalleryItem(ctx context.Context, item *GalleryItem) error {
	query := `INSERT INTO public.profile_gallery (profile_id, image_url, caption, tags) 
	          VALUES ($1, $2, $3, $4) 
	          RETURNING id, created_at`
	if item.Tags == nil {
		item.Tags = []string{}
	}
	return r.pool.QueryRow(ctx, query, DefaultProfileID, item.ImageURL, item.Caption, item.Tags).Scan(&item.ID, &item.CreatedAt)
}

func (r *postgresRepository) DeleteGalleryItem(ctx context.Context, id string) error {
	query := `DELETE FROM public.profile_gallery WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}
