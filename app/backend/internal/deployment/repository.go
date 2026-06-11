package deployment

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	GetDeploymentsByProjectID(ctx context.Context, projectId string) ([]Deployment, error)
	GetDeploymentByID(ctx context.Context, id string) (*Deployment, error)
	CreateDeployment(ctx context.Context, d *Deployment) error
	UpdateDeploymentStatus(ctx context.Context, id string, status string, logs string) error
	GetPendingDeployment(ctx context.Context) (*Deployment, error)
	DeleteDeployment(ctx context.Context, id string) error
}

type postgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(pool *pgxpool.Pool) Repository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) GetDeploymentsByProjectID(ctx context.Context, projectId string) ([]Deployment, error) {
	query := `SELECT id, project_id, status, COALESCE(logs, ''), created_at, updated_at 
	          FROM public.deployments 
	          WHERE project_id = $1 
	          ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query, projectId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Deployment
	for rows.Next() {
		var d Deployment
		err := rows.Scan(
			&d.ID,
			&d.ProjectID,
			&d.Status,
			&d.Logs,
			&d.CreatedAt,
			&d.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, d)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	if list == nil {
		list = []Deployment{}
	}

	return list, nil
}

func (r *postgresRepository) GetDeploymentByID(ctx context.Context, id string) (*Deployment, error) {
	query := `SELECT id, project_id, status, COALESCE(logs, ''), created_at, updated_at 
	          FROM public.deployments 
	          WHERE id = $1`

	var d Deployment
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&d.ID,
		&d.ProjectID,
		&d.Status,
		&d.Logs,
		&d.CreatedAt,
		&d.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &d, nil
}

func (r *postgresRepository) CreateDeployment(ctx context.Context, d *Deployment) error {
	query := `INSERT INTO public.deployments (project_id, status, logs) 
	          VALUES ($1, $2, $3) 
	          RETURNING id, created_at, updated_at`

	err := r.pool.QueryRow(
		ctx,
		query,
		d.ProjectID,
		d.Status,
		d.Logs,
	).Scan(&d.ID, &d.CreatedAt, &d.UpdatedAt)

	return err
}

func (r *postgresRepository) UpdateDeploymentStatus(ctx context.Context, id string, status string, logs string) error {
	query := `UPDATE public.deployments 
	          SET status = $1, logs = $2, updated_at = NOW() 
	          WHERE id = $3`

	commandTag, err := r.pool.Exec(ctx, query, status, logs, id)
	if err != nil {
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *postgresRepository) GetPendingDeployment(ctx context.Context) (*Deployment, error) {
	query := `SELECT id, project_id, status, COALESCE(logs, ''), created_at, updated_at 
	          FROM public.deployments 
	          WHERE status = 'Pending' 
	          ORDER BY created_at ASC 
	          LIMIT 1`

	var d Deployment
	err := r.pool.QueryRow(ctx, query).Scan(
		&d.ID,
		&d.ProjectID,
		&d.Status,
		&d.Logs,
		&d.CreatedAt,
		&d.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &d, nil
}

func (r *postgresRepository) DeleteDeployment(ctx context.Context, id string) error {
	query := `DELETE FROM public.deployments WHERE id = $1`

	commandTag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}
