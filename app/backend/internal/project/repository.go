package project

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	GetProjects(ctx context.Context) ([]Project, error)
	GetProjectByID(ctx context.Context, id string) (*Project, error)
	CreateProject(ctx context.Context, p *Project) error
	UpdateProject(ctx context.Context, id string, p *Project) error
	DeleteProject(ctx context.Context, id string) error
	AddProjectDocument(ctx context.Context, doc *ProjectDocument) error
	DeleteProjectDocument(ctx context.Context, id string) error
}

type postgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(pool *pgxpool.Pool) Repository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) GetProjects(ctx context.Context) ([]Project, error) {
	query := `SELECT id, title, description, tech, video_url, demo_url, git_url, status, deploys_count, is_visible, created_at, updated_at 
	          FROM public.projects 
	          ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []Project
	for rows.Next() {
		var p Project
		err := rows.Scan(
			&p.ID,
			&p.Title,
			&p.Description,
			&p.Tech,
			&p.VideoURL,
			&p.DemoURL,
			&p.GitURL,
			&p.Status,
			&p.DeploysCount,
			&p.IsVisible,
			&p.CreatedAt,
			&p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		p.Documents = []ProjectDocument{} // Initialize empty slice
		projects = append(projects, p)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	if projects == nil {
		projects = []Project{}
	}

	// Fetch project documents and map them
	if len(projects) > 0 {
		docQuery := `SELECT id, project_id, name, url, created_at FROM public.project_documents ORDER BY created_at DESC`
		docRows, err := r.pool.Query(ctx, docQuery)
		if err == nil {
			defer docRows.Close()
			docMap := make(map[string][]ProjectDocument)
			for docRows.Next() {
				var doc ProjectDocument
				if err := docRows.Scan(&doc.ID, &doc.ProjectID, &doc.Name, &doc.URL, &doc.CreatedAt); err == nil {
					docMap[doc.ProjectID] = append(docMap[doc.ProjectID], doc)
				}
			}
			for i := range projects {
				if docs, exists := docMap[projects[i].ID]; exists {
					projects[i].Documents = docs
				}
			}
		}
	}

	return projects, nil
}

func (r *postgresRepository) GetProjectByID(ctx context.Context, id string) (*Project, error) {
	query := `SELECT id, title, description, tech, video_url, demo_url, git_url, status, deploys_count, is_visible, created_at, updated_at 
	          FROM public.projects 
	          WHERE id = $1`

	var p Project
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.ID,
		&p.Title,
		&p.Description,
		&p.Tech,
		&p.VideoURL,
		&p.DemoURL,
		&p.GitURL,
		&p.Status,
		&p.DeploysCount,
		&p.IsVisible,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	p.Documents = []ProjectDocument{}
	docQuery := `SELECT id, project_id, name, url, created_at FROM public.project_documents WHERE project_id = $1 ORDER BY created_at DESC`
	docRows, err := r.pool.Query(ctx, docQuery, id)
	if err == nil {
		defer docRows.Close()
		for docRows.Next() {
			var doc ProjectDocument
			if err := docRows.Scan(&doc.ID, &doc.ProjectID, &doc.Name, &doc.URL, &doc.CreatedAt); err == nil {
				p.Documents = append(p.Documents, doc)
			}
		}
	}

	return &p, nil
}

func (r *postgresRepository) CreateProject(ctx context.Context, p *Project) error {
	query := `INSERT INTO public.projects (title, description, tech, video_url, demo_url, git_url, status, deploys_count, is_visible) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
	          RETURNING id, created_at, updated_at`

	if p.Status == "" {
		p.Status = "Active"
	}
	if p.Tech == nil {
		p.Tech = []string{}
	}

	err := r.pool.QueryRow(
		ctx,
		query,
		p.Title,
		p.Description,
		p.Tech,
		p.VideoURL,
		p.DemoURL,
		p.GitURL,
		p.Status,
		p.DeploysCount,
		p.IsVisible,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)

	return err
}

func (r *postgresRepository) UpdateProject(ctx context.Context, id string, p *Project) error {
	query := `UPDATE public.projects 
	          SET title = $1, description = $2, tech = $3, video_url = $4, demo_url = $5, git_url = $6, status = $7, deploys_count = $8, is_visible = $9
	          WHERE id = $10`

	if p.Tech == nil {
		p.Tech = []string{}
	}

	commandTag, err := r.pool.Exec(
		ctx,
		query,
		p.Title,
		p.Description,
		p.Tech,
		p.VideoURL,
		p.DemoURL,
		p.GitURL,
		p.Status,
		p.DeploysCount,
		p.IsVisible,
		id,
	)
	if err != nil {
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *postgresRepository) DeleteProject(ctx context.Context, id string) error {
	query := `DELETE FROM public.projects WHERE id = $1`

	commandTag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *postgresRepository) AddProjectDocument(ctx context.Context, doc *ProjectDocument) error {
	query := `INSERT INTO public.project_documents (project_id, name, url) 
	          VALUES ($1, $2, $3) 
	          RETURNING id, created_at`
	return r.pool.QueryRow(ctx, query, doc.ProjectID, doc.Name, doc.URL).Scan(&doc.ID, &doc.CreatedAt)
}

func (r *postgresRepository) DeleteProjectDocument(ctx context.Context, id string) error {
	query := `DELETE FROM public.project_documents WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}
