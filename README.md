# Webhook Pipeline System

## 📋 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Actions Reference](#actions-reference)


---

## 📖 Overview

**Webhook Pipeline System** is a service that receives webhooks, processes them through a job queue, and delivers results to registered subscribers. Think of it as a simplified Zapier - an inbound event triggers a processing step, and the result is forwarded to one or more destinations.

### Key Concepts

- **Pipeline**: A connection between a source URL, a processing action, and subscribers
- **Job**: A task created from an incoming webhook, processed asynchronously
- **Worker**: Background process that picks up and executes jobs
- **Subscriber**: URL where processed results are delivered

---

### Data Flow

1. **Webhook Received**: POST request to `/webhooks/{pipelineId}` with signature header
2. **Validation**: Signature verified using HMAC-SHA256
3. **Job Creation**: Job record created in PostgreSQL with status `pending`
4. **Queue Addition**: Job added to Redis queue
5. **Background Processing**: Worker picks up job, updates status to `processing`
6. **Action Execution**: Worker executes the configured action on the payload
7. **Result Delivery**: Result sent to all subscribers with retry logic (3 attempts)
8. **Status Update**: Job status updated to `completed` or `failed`
9. **Delivery Recording**: Each delivery attempt logged in `deliveries` table

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + TypeScript** | Runtime & language |
| **Express.js** | Web framework |
| **PostgreSQL** | Primary database |
| **Drizzle ORM** | Database ORM |
| **Redis + BullMQ** | Job queue management |
| **JWT** | Authentication |
| **Nodemailer** | Email sending |
| **Puppeteer** | PDF generation |
| **express-rate-limit** | Rate limiting |

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5/CSS3** | Structure & styling |
| **JavaScript** | Client-side logic |
| **Live Server** | Development server |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **GitHub Actions** | CI/CD pipeline |

---

## ✨ Features

### Core Features
- ✅ **CRUD API** for managing pipelines
- ✅ **Webhook ingestion** with signature verification
- ✅ **Asynchronous processing** with job queue (Redis+BullMQ)
- ✅ **Worker** for background job execution
- ✅ **Result delivery** to subscribers with retry logic
- ✅ **Job history** and status tracking
- ✅ **Delivery attempts** logging

### Actions (7 Types)
| Action | Description |
|--------|-------------|
| **Transform** | Rename fields and convert to uppercase |
| **Filter** | Apply conditional filters |
| **Enrich** | Add metadata (timestamp, source) |
| **Email** | Send email with optional attachments |
| **Validate JSON** | Validate required fields, types, and enums |
| **Replace Text** | Find and replace text in payload |
| **PDF Generator** | Create CV PDF from JSON data |

### Advanced Features
- 🔗 **Pipeline Chaining**: Pass results between pipelines
- 🔄 **Retry Logic**: Exponential backoff (3 attempts: 2s, 4s, 8s)
- 🛡️ **Signature Verification**: HMAC-SHA256 for webhook authenticity
- ⏱️ **Rate Limiting**: 10 webhooks per minute per pipeline
- 🎨 **Modern Dashboard**: User-friendly web interface
- 📊 **Job Tracking**: Complete history with payload and results
- 🐳 **Docker Support**: Full containerization
- ⚙️ **CI/CD Pipeline**: Automated testing with GitHub Actions

---


## 📋 Prerequisites

Before running this project, make sure you have:

| Requirement | Version        | Installation |
|-------------|----------------|--------------|
| **Node.js** | 18.x or higher | [nodejs.org](https://nodejs.org/) 
| **Docker**  | 20.x or higher | [docker.com](https://www.docker.com/products/docker-desktop/) 
| **Git**     | Latest         | [git-scm.com](https://git-scm.com/) 
| **npm**     | 9.x or higher  | Included with Node.js 

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jumanasaif/webhook.git
cd webhook
```
### 2. Configure Environment Variables

**Create .env file in the root directory:**

```bash
# SMTP Configuration (for email action)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```
**Create backend/.env file:**

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/webhook

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Port
PORT=3000

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```
### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 4. Run Database Migrations

```bash
cd backend
npm run db:generate
npm run db:migrate
cd ..
```

### 5. Running the Project

#### Option 1: Development Mode (Without Docker)

**Start Infrastructure (PostgreSQL & Redis):**

```bash
docker-compose up -d db redis
```

**Start Backend Server:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```
**Start Worker (in new terminal):**

```bash
cd backend
npm run worker
# Worker starts listening for jobs
```

**Start Frontend (in new terminal):**

```bash
cd frontend
npm start
# Dashboard runs on http://localhost:5500
```

#### Option 2: Full Docker Setup (Production Mode)
**Start All Services:**

```bash
docker-compose up --build
```

**Run Migrations (in another terminal):**

```bash
docker exec -it webhook-backend npm run db:migrate
```

**Access Services:**

Frontend: http://localhost:5500

Backend API: http://localhost:3000

#### Option 3: Docker Compose (Detached Mode)

```bash
# Start all services in background
docker-compose up -d

# Run migrations
docker exec -it webhook-backend npm run db:migrate

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---
## API Documentation

### Authentication Endpoints

|Method|	Endpoint|	Description|
|------|----------|------------|
|POST|	/auth/register|	Register new user
|POST|	/auth/login	|Login and get JWT token

**Register Example:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

**Login Example:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

### Pipeline Endpoints 
|Method|	Endpoint|	Description|
|------|----------|------------|
|GET	|/pipelines	|List all pipelines
|POST	|/pipelines	|Create new pipeline
|GET	|/pipelines/:id|	Get pipeline details
|PUT	|/pipelines/:id	|Update pipeline
|DELETE|	/pipelines/:id|	Delete pipeline
|GET	|/pipelines/:id/stats	|Get pipeline statistics

**Create Pipeline Example:**

```bash
curl -X POST http://localhost:3000/pipelines \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Processor",
    "actionType": "transform",
    "actionConfig": {
      "rename": {"name": "fullName"},
      "transform": "uppercase"
    }
  }'
```

### Subscriber Endpoints 
|Method|	Endpoint|	Description|
|------|----------|------------|
|POST	|/subscribers|	Add subscriber to pipeline
|GET	|/subscribers/:pipelineId	|List subscribers
|PUT	|/subscribers/:id	|Update subscriber URL
|DELETE|	/subscribers/:id	|Delete subscriber

### Job Endpoints 
|Method|	Endpoint|	Description|
|------|----------|------------|
|GET	|/jobs|	List all jobs
|GET	|/jobs/:id	|Get job details with deliveries
|DELETE|	/jobs/:id	|Delete job
|POST|	/jobs/:id/retry|	Retry failed job

### Webhook Endpoint (Public)
|Method|	Endpoint|	Description|
|------|----------|------------|
POST|	/webhooks/:pipelineId	|Send webhook with signature

**Webhook Example:**

```bash
# First, calculate signature
# echo -n '{"name":"John"}' | openssl dgst -sha256 -hmac "your-pipeline-secret"

# Then send webhook
curl -X POST http://localhost:3000/webhooks/{pipelineId} \
  -H "Content-Type: application/json" \
  -H "x-signature: calculated_signature" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```
---

## Actions Reference

### 1. Transform Action
*Rename fields and convert strings to uppercase.*

**Config:**
```bash
json
{
  "rename": {"name": "fullName", "age": "userAge"},
  "transform": "uppercase"
}
```

**Input:**
```bash
json
{"name": "john doe", "age": 25}
```

**Output:**
```bash
json
{"fullName": "JOHN DOE", "userAge": 25}
```

### 2. Filter Action
*Filter payload based on conditions.*

**Config:**
```bash
json
{
  "field": "age",
  "operator": "gt",
  "value": 18
}
```

*Operators: eq (equals), gt (greater than), lt (less than)*

### 3. Enrich Action
*Add metadata to payload.*

**Output (auto):**
```bash
json
{
  ...original,
  "enrichedAt": "2026-03-25T10:00:00.000Z",
  "source": "webhook-system"
}
```

### 4. Email Action
*Send emails with optional PDF attachments.*

**Config:**
```bash
json
{
  "to": "recipient@example.com",
  "subject": "Notification",
  "body": "<h1>Hello {{name}}</h1>"
}
```

### 5. Validate JSON Action
*Validate required fields, types, and enums.*

**Config:**
```bash
json
{
  "requiredFields": ["name", "email"],
  "fieldTypes": {"age": "number"},
  "enumFields": {"status": ["pending", "completed"]}
}
```

### 6. Replace Text Action
*Find and replace text in payload.*

**Config:**
```bash
json
{
  "replacements": [
    {"find": "old", "replace": "new"},
    {"find": "Gmail", "replace": "gmail"}
  ]
}
```

### 7. PDF Generator Action
*Generate CV PDF from JSON data.*

**Config:**
```bash
json
{
  "template": "professional",
  "output": "both",
  "filename": "cv-{{name}}.pdf"
}
```
**Input (CV Data):**
```bash
json
{
  "personal": {
    "fullName": "Jumana Saif",
    "email": "jumana@example.com",
    "phone": "+962 7 1234 5678",
    "location": "Palestine, Nablus",
    "summary": "Experienced developer..."
  },
  "experience": [
    {
      "title": "Backend Developer",
      "company": "Tech Corp",
      "startDate": "2022-01",
      "endDate": "Present",
      "description": "Developed APIs..."
    }
  ],
  "education": [
    {
      "degree": "Computer Engineering",
      "institution": "University",
      "year": "2025"
    }
  ],
  "skills": ["Node.js", "TypeScript", "PostgreSQL"]
}
```
