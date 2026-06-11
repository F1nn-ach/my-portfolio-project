package main

import (
	"context"
	"log"
	"os"

	"github.com/F1nn-ach/my-portfolio-project/internal/auth"
	"github.com/F1nn-ach/my-portfolio-project/internal/deployment"
	"github.com/F1nn-ach/my-portfolio-project/internal/profile"
	"github.com/F1nn-ach/my-portfolio-project/internal/project"
	stg "github.com/F1nn-ach/my-portfolio-project/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	// Load environment variables (from .env in app/backend/)
	_ = godotenv.Load()

	// Ensure local storage directories exist
	_ = os.MkdirAll("storage/images", 0755)
	_ = os.MkdirAll("storage/videos", 0755)
	_ = os.MkdirAll("storage/resumes", 0755)

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatalf("DATABASE_URL environment variable is not set")
	}

	// Create a postgres db connection pool
	dbPool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer dbPool.Close()

	// Verify connection
	if err := dbPool.Ping(context.Background()); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Database connection pool established successfully")

	// Set up repositories and handlers
	projectRepo := project.NewPostgresRepository(dbPool)
	projectHandler := project.NewHandler(projectRepo)

	profileRepo := profile.NewPostgresRepository(dbPool)
	profileHandler := profile.NewHandler(profileRepo)

	deploymentRepo := deployment.NewPostgresRepository(dbPool)
	deploymentHandler := deployment.NewHandler(deploymentRepo)

	storageHandler := stg.NewHandler()

	// Configure Gin Router
	r := gin.Default()
	r.Use(CORSMiddleware())

	// Serve storage directory as static files
	r.Static("/storage", "./storage")

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "UP"})
	})

	// Public Routes
	r.GET("/projects", projectHandler.GetProjects)
	r.GET("/projects/:id", projectHandler.GetProject)
	r.GET("/projects/:id/deployments", deploymentHandler.GetProjectDeployments)
	r.GET("/profile", profileHandler.GetProfile)

	// Protected Routes (require valid JWT token)
	authorized := r.Group("/")
	authorized.Use(auth.AuthMiddleware())
	{
		authorized.POST("/projects", projectHandler.CreateProject)
		authorized.PUT("/projects/:id", projectHandler.UpdateProject)
		authorized.DELETE("/projects/:id", projectHandler.DeleteProject)
		authorized.POST("/projects/:id/documents", projectHandler.AddProjectDocument)
		authorized.DELETE("/projects/documents/:doc_id", projectHandler.DeleteProjectDocument)

		authorized.POST("/projects/:id/deployments", deploymentHandler.CreateDeployment)
		authorized.DELETE("/deployments/:id", deploymentHandler.DeleteDeployment)

		authorized.PUT("/profile", profileHandler.UpdateProfile)
		authorized.POST("/profile/documents", profileHandler.AddProfileDocument)
		authorized.DELETE("/profile/documents/:id", profileHandler.DeleteProfileDocument)
		authorized.POST("/profile/gallery", profileHandler.AddGalleryItem)
		authorized.DELETE("/profile/gallery/:id", profileHandler.DeleteGalleryItem)

		authorized.POST("/upload", storageHandler.UploadFile)
		authorized.DELETE("/upload", storageHandler.DeleteFile)
	}

	// Determine port to listen on
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting backend server on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run backend server: %v", err)
	}
}
