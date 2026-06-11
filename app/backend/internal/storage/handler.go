package storage

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	subDir := "images"
	if ext == ".pdf" {
		subDir = "resumes"
	} else if ext == ".mp4" || ext == ".webm" || ext == ".avi" || ext == ".mov" {
		subDir = "videos"
	}

	dirPath := filepath.Join("storage", subDir)
	_ = os.MkdirAll(dirPath, 0755)

	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	targetPath := filepath.Join(dirPath, filename)

	if err := c.SaveUploadedFile(file, targetPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save file: %v", err)})
		return
	}

	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	host := c.Request.Host
	url := fmt.Sprintf("%s://%s/storage/%s/%s", scheme, host, subDir, filename)

	c.JSON(http.StatusOK, gin.H{"url": url})
}

func (h *Handler) DeleteFile(c *gin.Context) {
	fileURL := c.Query("url")
	if fileURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file URL is required"})
		return
	}

	parts := strings.Split(fileURL, "/storage/")
	if len(parts) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file URL"})
		return
	}

	localPath := filepath.Join("storage", parts[1])

	absPath, err := filepath.Abs(localPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get absolute path"})
		return
	}

	absStorage, err := filepath.Abs("storage")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get storage absolute path"})
		return
	}

	if !strings.HasPrefix(absPath, absStorage) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if _, err := os.Stat(localPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found on disk"})
		return
	}

	if err := os.Remove(localPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to delete file: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
}
