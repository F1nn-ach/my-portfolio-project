package main

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/F1nn-ach/my-portfolio-project/internal/deployment"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Load environment variables (from .env in app/backend/)
	_ = godotenv.Load()

	log.Println("Starting Deployment Worker Daemon...")

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatalf("DATABASE_URL environment variable is not set")
	}

	// 2. Connect to database pool
	dbPool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Worker unable to connect to database: %v", err)
	}
	defer dbPool.Close()

	// Verify database connection
	if err := dbPool.Ping(context.Background()); err != nil {
		log.Fatalf("Worker failed to ping database: %v", err)
	}
	log.Println("Worker connected to database pool successfully")

	// Instantiate repository
	repo := deployment.NewPostgresRepository(dbPool)

	// Set up shutdown signal listening
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, os.Interrupt, syscall.SIGTERM)

	// Create stop channel for worker loop
	stopChan := make(chan struct{})
	go func() {
		<-shutdownChan
		log.Println("Shutting down worker gracefully...")
		close(stopChan)
	}()

	// 3. Worker Polling Loop
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	log.Println("Deployment Worker is polling for pending tasks every 5 seconds...")

	for {
		select {
		case <-stopChan:
			log.Println("Worker daemon stopped.")
			return
		case <-ticker.C:
			ctx := context.Background()
			d, err := repo.GetPendingDeployment(ctx)
			if err != nil {
				log.Printf("Worker error querying pending deployments: %v", err)
				continue
			}

			if d != nil {
				log.Printf("Worker found pending deployment task (ID: %s) for Project (ID: %s). Processing...", d.ID, d.ProjectID)
				processDeployment(ctx, d, dbPool, repo)
			}
		}
	}
}

// runCmd helper to execute a system command, returning output and error
func runCmd(ctx context.Context, dir string, name string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	cmd.Dir = dir
	var outBuf bytes.Buffer
	cmd.Stdout = &outBuf
	cmd.Stderr = &outBuf
	err := cmd.Run()
	return outBuf.String(), err
}

// processDeployment handles cloning, docker building, container running, and nginx mapping
func processDeployment(ctx context.Context, d *deployment.Deployment, dbPool *pgxpool.Pool, repo deployment.Repository) {
	// 1. Fetch project details to get git_url and slug title
	var projectTitle, gitURL, demoURL string
	query := `SELECT title, COALESCE(git_url, ''), COALESCE(demo_url, '') 
	          FROM public.projects 
	          WHERE id = $1`
	err := dbPool.QueryRow(ctx, query, d.ProjectID).Scan(&projectTitle, &gitURL, &demoURL)
	if err != nil {
		log.Printf("Error fetching project details: %v", err)
		_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Failed", fmt.Sprintf("Build failed: could not fetch project details: %v", err))
		return
	}

	// Resolve actual repository target
	targetRepo := gitURL
	if targetRepo == "" {
		targetRepo = demoURL
	}
	if targetRepo == "" {
		_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Failed", "Build failed: no repository URL or demo URL provided for the project")
		return
	}

	projectSlug := sanitizeSlug(projectTitle)
	buildLogs := fmt.Sprintf("[%s] Starting deployment process for %s...\n", time.Now().Format(time.RFC3339), projectTitle)
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	// Create workspace directories
	buildDir := filepath.Join("/tmp", "builds", "project-"+projectSlug)
	buildLogs += fmt.Sprintf("[%s] Cleaning up old build workspace...\n", time.Now().Format(time.RFC3339))
	_ = os.RemoveAll(buildDir)
	_ = os.MkdirAll(filepath.Dir(buildDir), 0755)

	// 2. Clone Git Repository Step
	buildLogs += fmt.Sprintf("[%s] Cloning repository: %s...\n", time.Now().Format(time.RFC3339), targetRepo)
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	cloneOutput, err := runCmd(ctx, "", "git", "clone", "--depth", "1", targetRepo, buildDir)
	buildLogs += cloneOutput + "\n"
	if err != nil {
		buildLogs += fmt.Sprintf("Error cloning repository: %v\n", err)
		_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Failed", buildLogs)
		return
	}
	buildLogs += "Repository cloned successfully.\n"
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	// 3. Verify / Generate Dockerfile
	dockerfilePath := filepath.Join(buildDir, "Dockerfile")
	if _, err := os.Stat(dockerfilePath); os.IsNotExist(err) {
		buildLogs += fmt.Sprintf("[%s] No Dockerfile found in repository. Generating fallback static Dockerfile...\n", time.Now().Format(time.RFC3339))
		_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

		fallbackContent := ""
		if _, errPkg := os.Stat(filepath.Join(buildDir, "package.json")); errPkg == nil {
			// Basic Node/React build fallback
			fallbackContent = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build || true

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/build /usr/share/nginx/html
COPY --from=builder /app/out /usr/share/nginx/html
EXPOSE 80
`
		} else {
			// Simple static site HTML/CSS/JS fallback
			fallbackContent = `FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
`
		}
		errWrite := os.WriteFile(dockerfilePath, []byte(fallbackContent), 0644)
		if errWrite != nil {
			buildLogs += fmt.Sprintf("Error generating fallback Dockerfile: %v\n", errWrite)
			_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Failed", buildLogs)
			return
		}
		buildLogs += "Generated fallback Dockerfile successfully.\n"
		_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)
	}

	// 4. Docker Image Build Step
	imageName := "portfolio-app-" + projectSlug
	buildLogs += fmt.Sprintf("[%s] Building Docker image '%s'...\n", time.Now().Format(time.RFC3339), imageName)
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	buildOutput, err := runCmd(ctx, buildDir, "docker", "build", "-t", imageName, ".")
	buildLogs += buildOutput + "\n"
	if err != nil {
		buildLogs += fmt.Sprintf("Docker build failed: %v\n", err)
		_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Failed", buildLogs)
		return
	}
	buildLogs += "Docker image built successfully.\n"
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	// 5. Clean up old container if running
	containerName := "container-" + projectSlug
	buildLogs += fmt.Sprintf("[%s] Stopping and removing any existing container '%s'...\n", time.Now().Format(time.RFC3339), containerName)
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	_, _ = runCmd(ctx, "", "docker", "rm", "-f", containerName)

	// 6. Run Docker Container on shared network
	buildLogs += fmt.Sprintf("[%s] Starting new container on network 'portfolio_network'...\n", time.Now().Format(time.RFC3339))
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	runOutput, err := runCmd(ctx, "", "docker", "run", "-d", "--name", containerName, "--network", "portfolio_network", imageName)
	buildLogs += runOutput + "\n"
	if err != nil {
		buildLogs += fmt.Sprintf("Docker run failed: %v\n", err)
		_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Failed", buildLogs)
		return
	}
	buildLogs += "Container started successfully.\n"
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	// 7. Update Nginx configuration & reload Nginx
	buildLogs += fmt.Sprintf("[%s] Creating Nginx reverse-proxy routing configurations...\n", time.Now().Format(time.RFC3339))
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	nginxConf := fmt.Sprintf(`location /%s/ {
    proxy_pass http://%s:80/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
`, projectSlug, containerName)

	nginxConfPath := filepath.Join("/etc/nginx/conf.d", "project-"+projectSlug+".conf")
	errWrite := os.WriteFile(nginxConfPath, []byte(nginxConf), 0644)
	if errWrite != nil {
		buildLogs += fmt.Sprintf("Failed to write Nginx config: %v\n", errWrite)
		_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Failed", buildLogs)
		return
	}
	buildLogs += fmt.Sprintf("Wrote config to %s\n", nginxConfPath)

	buildLogs += fmt.Sprintf("[%s] Reloading Nginx server...\n", time.Now().Format(time.RFC3339))
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	// Reload Nginx container named 'portfolio-nginx'
	reloadOutput, err := runCmd(ctx, "", "docker", "exec", "portfolio-nginx", "nginx", "-s", "reload")
	buildLogs += reloadOutput + "\n"
	if err != nil {
		buildLogs += fmt.Sprintf("Failed to reload Nginx: %v\n", err)
		_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Failed", buildLogs)
		return
	}
	buildLogs += "Nginx server reloaded successfully.\n"
	_ = repo.UpdateDeploymentStatus(ctx, d.ID, "Building", buildLogs)

	// 8. Complete and save deployment status
	buildLogs += fmt.Sprintf("[%s] Deployment completed successfully! Live at http://localhost:3000/%s/\n", time.Now().Format(time.RFC3339), projectSlug)
	err = repo.UpdateDeploymentStatus(ctx, d.ID, "Success", buildLogs)
	if err != nil {
		log.Printf("Worker error updating status: %v", err)
	}

	// Increment projects deploys_count by 1
	_, _ = dbPool.Exec(ctx, "UPDATE public.projects SET deploys_count = deploys_count + 1 WHERE id = $1", d.ProjectID)

	log.Printf("Worker successfully finished deployment %s (Status: Success)", d.ID)
}

func sanitizeSlug(title string) string {
	var slug []rune
	for _, r := range title {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			slug = append(slug, r)
		} else if r >= 'A' && r <= 'Z' {
			slug = append(slug, r+32) // Convert to lowercase
		} else if r == ' ' || r == '-' || r == '_' {
			if len(slug) > 0 && slug[len(slug)-1] != '-' {
				slug = append(slug, '-')
			}
		}
	}
	result := string(slug)
	result = strings.Trim(result, "-")
	if len(result) == 0 {
		return "project"
	}
	return result
}
