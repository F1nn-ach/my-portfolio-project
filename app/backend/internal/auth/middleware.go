package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type SupabaseUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func AuthMiddleware() gin.HandlerFunc {
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		supabaseURL = os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
	}
	if supabaseURL == "" {
		supabaseURL = "http://localhost:54321"
	}
	supabaseURL = strings.TrimSuffix(supabaseURL, "/")

	supabaseAnonKey := os.Getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be 'Bearer <token>'"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Call Supabase /auth/v1/user endpoint to verify the token
		req, err := http.NewRequest("GET", supabaseURL+"/auth/v1/user", nil)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("Failed to build request: %v", err)})
			c.Abort()
			return
		}

		req.Header.Set("Authorization", "Bearer "+tokenString)
		if supabaseAnonKey != "" {
			req.Header.Set("apikey", supabaseAnonKey)
		}

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("Failed to contact Supabase Auth: %v", err)})
			c.Abort()
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			var errData map[string]interface{}
			_ = json.NewDecoder(resp.Body).Decode(&errData)
			errMsg := "Invalid or expired token"
			if errData != nil {
				if msg, exists := errData["msg"]; exists {
					errMsg = fmt.Sprintf("Supabase auth error: %v", msg)
				} else if msg, exists := errData["error"]; exists {
					errMsg = fmt.Sprintf("Supabase auth error: %v", msg)
				}
			}
			c.JSON(http.StatusUnauthorized, gin.H{"error": errMsg})
			c.Abort()
			return
		}

		var user SupabaseUser
		if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to parse user info from Supabase"})
			c.Abort()
			return
		}

		if user.Role != "authenticated" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access forbidden: insufficient role permissions"})
			c.Abort()
			return
		}

		c.Set("user_id", user.ID)
		c.Next()
	}
}
