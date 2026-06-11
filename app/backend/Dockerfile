# Build stage
FROM golang:1.25-alpine AS builder

# Install certificates and git
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Run stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy the pre-built binary
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
