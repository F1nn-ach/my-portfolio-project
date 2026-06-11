# 🧭 Portfolio Project Roadmap (Next.js + Go + Supabase + Docker)

---

## 🟢 Phase 1: Foundation (DONE)
- [x] Setup Next.js frontend
- [x] Setup Go backend (Gin)
- [x] Setup Supabase project (local + cloud)
- [x] Connect Go backend to Supabase database
- [x] Setup Docker environment (basic)
- [x] Git repository initialization

---

## 🟡 Phase 2: Core System (DONE)

### 🔐 Authentication (Supabase + Next.js)
- [x] Implement Supabase Auth (login/register)
- [x] Setup session handling in Next.js
- [x] Protect routes (middleware / guards)
- [x] Store user session securely (cookies / local storage strategy)

---

### 🧠 Backend API (Go)
- [x] Define project architecture (handler / service / repository)
- [x] Create project CRUD APIs
  - [x] GET /projects
  - [x] POST /projects
  - [x] PUT /projects/:id
  - [x] DELETE /projects/:id
- [x] Connect APIs to Supabase database

---

### 🔐 Security Layer (Go Middleware)
- [x] JWT verification middleware
- [x] Extract user ID from token
- [x] Protect private routes

---

### 🗄️ Database Design (Supabase)
- [x] Define `projects` table
- [x] Define `users` relation (if needed)
- [x] Define `deployments` table
- [x] Define `logs` table (stored within deployments table)

---

## 🔵 Phase 3: Admin CMS System (IN PROGRESS)

### 🧑‍💻 Admin Dashboard (Next.js)
- [x] Build admin dashboard UI
- [x] Create project management page
- [x] Add project CRUD UI
- [ ] Add environment variable manager UI

---

### 🚀 Deployment Control (DONE)
- [x] Add "Deploy Project" button
- [x] Trigger backend deploy API
- [x] Show deployment status

---

### 🔗 GitHub Integration (Optional)
- [ ] Connect GitHub API
- [ ] Fetch repositories
- [ ] Select repo for deployment

---

## 🟢 Phase 4: Docker Deployment System (DONE)

- [x] Build Docker runner service (Go)
- [x] Clone Git repository automatically
- [x] Build Docker image from repo
- [x] Run container dynamically
- [x] Expose container port
- [x] Manage running containers

---

## 🟢 Phase 5: Production Layer (DONE)

- [x] Setup Nginx reverse proxy
- [x] Map domain to containers (mapped to path-based routing `localhost:3000/project-slug/`)
- [x] Add path-based routing (project-based)
- [ ] Add SSL (HTTPS)


---

## 🟣 Phase 6: Polish & Scaling

- [ ] Add logging system (deployment logs)
- [ ] Add error tracking system
- [ ] UI polish (shadcn/ui improvements)
- [ ] Loading / error states everywhere
- [ ] Rate limiting API
- [ ] Security hardening

---

## 🎯 Final Goal

- [ ] Deploy portfolio platform live
- [ ] Manage projects via admin dashboard
- [ ] Deploy GitHub repos as live apps
- [ ] Fully automated Docker-based deployment system