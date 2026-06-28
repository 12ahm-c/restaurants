Infra Plan – RestoManager

Version 1.0
Production‑Ready & Scalable Infrastructure

---

1. Overview

This document defines the infrastructure for RestoManager, a SaaS restaurant management system.
Based on the architecture described in architecture.md, the platform consists of:

· Backend API – Node.js (Express), modular monolith (future microservices)
· Frontend – React.js + Vite (SPA with PWA capabilities)
· Database – MongoDB (transactional, aggregation pipelines)
· Cache & Queues – Redis (session store, BullMQ queue, pub/sub for Socket.IO)
· Object Storage – AWS S3 (or compatible) for PDF invoices, tickets, and reports
· External Services – WhatsApp Business API, Email (SMTP), Firebase Cloud Messaging (push), Printer drivers/APIs

The infrastructure must be production‑ready, scalable, secure, and support environment separation (dev / staging / prod).

---

2. Infrastructure Components

Component Technology Purpose
Compute (API) Docker + AWS ECS (Fargate) Stateless backend containers, auto‑scaling
Compute (Frontend) Docker + AWS ECS (Fargate) or Vercel React SPA / PWA hosting
Load Balancer AWS Application Load Balancer (ALB) Distribute traffic, SSL termination, WebSocket support
Database MongoDB Atlas (M10+ dedicated) Managed, backups, sharding ready
Cache & Queue Redis (Upstash or AWS ElastiCache) Session store, BullMQ, Socket.IO adapter
Object Storage AWS S3 PDF invoices, tickets, reports, logs
CDN CloudFront (optional) Accelerate static assets and PDFs
DNS & SSL Route53 + AWS ACM Custom domain, TLS certificates
Monitoring & Logging CloudWatch, Datadog (optional) Metrics, logs, alerts
CI/CD GitHub Actions / GitLab CI Build, test, push to ECR, deploy
Backup & DR Atlas native + S3 Glacier Database backups, configuration backups

---

3. Compute & Orchestration

3.1 Containerization

All services are containerised using Docker:

· Backend Dockerfile (Node.js 20 Alpine)
· Frontend Dockerfile (Nginx serving built static files or Node.js for SSR if needed)
· Worker Dockerfile (dedicated BullMQ worker service)

3.2 Orchestration – AWS ECS Fargate

· Backend service
  · Task size: 1 vCPU, 2 GB RAM (scalable)
  · Desired count: 2 (min) / 6 (max)
  · Auto‑scaling based on CPU > 70% or request count > 1000/min
· Worker service (BullMQ)
  · Task size: 0.5 vCPU, 1 GB RAM
  · Desired count: 1 (min) / 4 (max)
  · Auto‑scaling based on queue length > 500 jobs
· Frontend service
  · Task size: 0.5 vCPU, 1 GB RAM
  · Desired count: 2 (min) / 4 (max)

Alternative for frontend: deploy on Vercel (simpler, global CDN) – then only backend runs on ECS.

3.3 Load Balancer (ALB)

· Listener 443 (HTTPS) with ACM certificate
· Target groups:
  · /api/* → backend service (port 3001)
  · /socket.io/* → backend service (WebSocket support, stickiness enabled)
  · /* → frontend service (port 3000)
· Health checks:
  · Backend: GET /health → 200 OK
  · Frontend: GET / → 200 OK
  · Worker: no public health check (internal monitoring via CloudWatch)

---

4. Network & Security

4.1 VPC Design

· 2 public subnets (for ALB, NAT gateways)
· 2 private subnets (for ECS tasks, database, Redis)
· NAT Gateways in each public subnet (for outbound internet from private subnets)

4.2 Security Groups

Service Inbound Rules Outbound Rules
ALB 443 (HTTPS) from 0.0.0.0/0 3000, 3001 to ECS
Backend ECS 3001 from ALB SG 27017 (MongoDB), 6379 (Redis), 443 (S3, WhatsApp, FCM)
Frontend ECS 3000 from ALB SG 443 (API calls)
Worker ECS none (internal) 27017 (MongoDB), 6379 (Redis), 443 (S3, external)
MongoDB Atlas 27017 from backend & worker ECS SG (IP whitelist) –
Redis (ElastiCache) 6379 from backend & worker ECS SG –

4.3 Secrets & Environment Variables

All secrets stored in AWS Secrets Manager or Parameter Store (SecureString).

Example secrets:

· MONGODB_URI
· REDIS_URL
· JWT_SECRET, JWT_REFRESH_SECRET
· WHATSAPP_ACCESS_TOKEN
· FCM_SERVER_KEY
· SMTP_USER, SMTP_PASS
· AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY

ECS task definitions inject secrets via environment variables.

---

5. Storage

5.1 Object Storage (S3)

· Bucket: restomanager-<env>-documents
· Lifecycle rules:
  · Move PDFs older than 90 days to S3 Glacier Instant Retrieval
  · Delete after 2 years
· Access: Backend assumes an IAM role with PutObject, GetObject permissions.
· Public access: Documents are private; access via signed URLs (expiry 1 hour).

5.2 Temporary / Ephemeral Storage

· ECS tasks use ephemeral storage for /tmp (PDF generation temporary files).
· For large files, stream directly to S3 without local disk.
· Printer spooling uses /tmp for temporary thermal receipt generation.

---

6. Databases & Caching

6.1 MongoDB Atlas

· Tier: M10 (dedicated) – 2 vCPU, 4 GB RAM, 40 GB storage
· Replica set: 3 nodes (primary + 2 secondary) – automatic failover
· Backup: Continuous (point‑in‑time recovery) + daily snapshots (retention 30 days)
· Indexes (as per architecture.md):
  · orders on status, createdAt, branchId
  · orders compound index on tableId, status
  · products on name, categoryId
  · inventory on branchId, name
  · kitchenQueue on status, priority
  · customers on phone, email
  · logs on timestamp (desc), userId, entity

6.2 Redis – ElastiCache (or Upstash)

· Node type: cache.t3.micro (for dev) / cache.t3.small (prod)
· Cluster mode: disabled (but use Redis Cluster for V2 > 2000 users)
· Use cases:
  · Session store (if needed)
  · BullMQ queue backend
  · Socket.IO pub/sub adapter (so multiple backend instances share WebSocket events)
  · Caching menu data (POS performance)
· Eviction policy: volatile-lru for cache keys
· Memory limit: 1.37 GB (t3.small)

---

7. Messaging & Queue (BullMQ)

7.1 Queues

Queue Name Purpose Priority
pdf-generation Generate invoices, tickets, reports High
notifications Send push, email, WhatsApp notifications Normal
printer Spool thermal receipts to printers High
loyalty Process loyalty points after payment Low
report-generation Generate and email reports Low

7.2 Configuration

```javascript
// Example BullMQ queue
const pdfQueue = new Queue('pdf-generation', { 
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false
  }
});
```

7.3 Workers

· Each backend instance runs a worker process (separate thread).
· For higher throughput, deploy dedicated worker service on ECS.
· Dead Letter Queue: Failed jobs are moved to :failed queues for manual inspection.

---

8. Environments & Separation

Environment Purpose Subdomain MongoDB Tier Redis Auto‑scaling
dev Active development dev.api.restomanager.com M0 (free) local / Upstash free 1 instance, no scaling
staging Pre‑production testing staging.api.restomanager.com M10 (shared) t3.micro 1–2 instances
prod Live customers api.restomanager.com M30+ (dedicated) t3.small 2–6 instances

· Namespaces in MongoDB: separate databases (restomanager_dev, restomanager_staging, restomanager_prod).
· S3 buckets: separate per environment (e.g., restomanager-prod-documents).
· Redis: separate instances per environment.

---

9. CI/CD Pipeline

Tool: GitHub Actions (or GitLab CI)

9.1 Workflow Steps

1. Test – run lint, unit tests, integration tests (with ephemeral MongoDB)
2. Build – Docker images for backend, frontend, and worker
3. Push to Amazon ECR (Elastic Container Registry)
4. Deploy – update ECS task definitions and services (blue/green via CodeDeploy)

9.2 Branch Strategy

· main → deploys to staging automatically
· release/* → manual approval for production

Environment variables and secrets are swapped via AWS Secrets Manager.

---

10. Monitoring, Logging & Alerting

10.1 Logging

· Backend logs: stdout / stderr → CloudWatch Logs group /ecs/restomanager-backend
· Worker logs: /ecs/restomanager-worker
· Retention: 30 days
· Structured logging: JSON format (level, timestamp, message, requestId, userId, branchId)

10.2 Metrics & Alarms (CloudWatch)

Metric Threshold Action
CPUUtilization (backend) > 80% for 5 minutes Scale out ECS tasks
CPUUtilization (worker) > 75% for 5 minutes Scale out workers
MemoryUtilization (any) > 85% for 5 minutes Increase task size / investigate leaks
MongoDB connections > 80% of limit Increase M10 → M20, or investigate leaks
BullMQ queue length (any) > 500 jobs for 10 minutes Add dedicated workers
BullMQ queue length (pdf) > 1000 jobs for 5 minutes Critical alert, add workers
5xx error rate > 2% for 2 minutes PagerDuty alert, rollback if recent deploy
ALB UnhealthyHostCount > 0 for 1 minute Investigate container health
Kitchen queue wait time > 10 minutes for any order Alert kitchen manager, check workflow

10.3 Tracing (optional)

· AWS X‑Ray for request tracing across API, MongoDB, Redis, S3.

---

11. Backup & Disaster Recovery

11.1 Database (MongoDB Atlas)

· Automated snapshots: every 6 hours, retained 30 days
· Point‑in‑time recovery: enabled (last 24 hours)
· Cross‑region replication: optional (replica in another AWS region for DR)

11.2 Configuration & Code

· Infrastructure as Code (Terraform or AWS CDK) stored in Git
· Secrets backed up in AWS Secrets Manager (cross‑region replication)

11.3 Recovery Procedure (RTO / RPO)

Component RTO RPO Method
MongoDB 2 hours 15 min Restore from snapshot + oplog replay
Backend 30 min – Re‑deploy last known image from ECR
S3 objects 1 hour 1 hour Versioning enabled, cross‑region copy
Redis 1 hour 15 min Restore from snapshot (ElastiCache)

---

12. Scalability Strategy (V1 → V2)

Layer V1 (MVP / launch) V2 (growth)
Backend 2 ECS tasks, shared workers Dedicated BullMQ workers (3+), separate scaling
Database M10 replica set M40 sharded cluster (by branch tenant)
Redis Single node, t3.small Redis Cluster (6 shards)
Frontend Vercel or 2 ECS tasks CDN + Edge functions for personalization
Queue Single Redis instance Separate Redis for queue vs cache
Printers Direct IP printing via worker Print spooler service with retry & status
Eventual features – Microservices (Orders, Inventory, Kitchen) with API Gateway

Horizontal scaling trigger:

· Backend: CPU > 70% or requests > 500/task/second
· Workers: queue length > 500 for 5 minutes
· Kitchen: order wait time > 8 minutes

---

13. Cost Estimation (example – AWS eu-west-3)

Service Configuration Monthly (approx)
ECS Fargate (2 tasks) 1 vCPU / 2 GB each $80
ECS Worker (1 task) 0.5 vCPU / 1 GB $20
ALB 1 LCU + data $25
MongoDB Atlas M10 dedicated, 3 nodes $300
ElastiCache Redis cache.t3.small (1 node) $35
S3 + requests 50 GB storage + GET/PUT $5
NAT Gateway 2 × NAT gateways $65
Data transfer (out) 200 GB $20
CloudWatch / Logs 10 GB logs + metrics $10
Printer integration API calls to external printers $10
Total ~ $570 / month (plus external service costs) 

Use savings plans / reserved instances for 30‑40% reduction.

---

14. Ports & Service Summary

Service Port Protocol Access
Backend API 3001 HTTP Internal – ALB listener
Frontend (React) 3000 HTTP Internal – ALB listener
MongoDB 27017 TCP VPC private – only ECS tasks
Redis 6379 TCP VPC private – only ECS tasks
Socket.IO (same as API) 3001 WS ALB with WebSocket support
Health check endpoint 3001 HTTP GET /health (allowed from ALB SG)
Printer (thermal) 9100 TCP Optional – direct to printer IPs (V2)

---

15. Deployment Runbook (First Production Release)

1. Bootstrap infrastructure with Terraform (VPC, ECS cluster, S3, Security Groups)
2. Create MongoDB Atlas project and whitelist ECS VPC CIDR
3. Set up Redis (ElastiCache) in private subnets
4. Build & push initial Docker images to ECR (backend, frontend, worker)
5. Create ECS task definitions (backend, frontend, worker)
6. Create ALB and target groups, configure listeners
7. Set up CI/CD pipeline (GitHub Actions)
8. Run smoke tests (login, create order, verify kitchen queue, test printer)
9. Enable monitoring (CloudWatch dashboards, alarms)
10. Configure backup schedules (MongoDB Atlas, S3 cross‑region)
11. Configure printer integration (CUPS server or cloud printer API)

---

16. Appendices

A. Example ECS Task Definition (backend)

```json
{
  "family": "restomanager-backend",
  "taskRoleArn": "arn:aws:iam::...:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::...:role/ecsExecutionRole",
  "networkMode": "awsvpc",
  "containerDefinitions": [{
    "name": "backend",
    "image": "<account>.dkr.ecr.<region>.amazonaws.com/restomanager-backend:latest",
    "portMappings": [{"containerPort": 3001, "protocol": "tcp"}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "REDIS_URL", "value": "redis://...:6379"}
    ],
    "secrets": [
      {"name": "MONGODB_URI", "valueFrom": "arn:aws:secretsmanager:.../MONGODB_URI"},
      {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:.../JWT_SECRET"},
      {"name": "WHATSAPP_ACCESS_TOKEN", "valueFrom": "arn:aws:secretsmanager:.../WHATSAPP_ACCESS_TOKEN"},
      {"name": "FCM_SERVER_KEY", "valueFrom": "arn:aws:secretsmanager:.../FCM_SERVER_KEY"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/restomanager-backend",
        "awslogs-region": "eu-west-3",
        "awslogs-stream-prefix": "backend"
      }
    }
  }],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048"
}
```

B. Example ECS Task Definition (worker)

```json
{
  "family": "restomanager-worker",
  "taskRoleArn": "arn:aws:iam::...:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::...:role/ecsExecutionRole",
  "networkMode": "awsvpc",
  "containerDefinitions": [{
    "name": "worker",
    "image": "<account>.dkr.ecr.<region>.amazonaws.com/restomanager-worker:latest",
    "portMappings": [],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "REDIS_URL", "value": "redis://...:6379"}
    ],
    "secrets": [
      {"name": "MONGODB_URI", "valueFrom": "arn:aws:secretsmanager:.../MONGODB_URI"},
      {"name": "WHATSAPP_ACCESS_TOKEN", "valueFrom": "arn:aws:secretsmanager:.../WHATSAPP_ACCESS_TOKEN"},
      {"name": "FCM_SERVER_KEY", "valueFrom": "arn:aws:secretsmanager:.../FCM_SERVER_KEY"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/restomanager-worker",
        "awslogs-region": "eu-west-3",
        "awslogs-stream-prefix": "worker"
      }
    }
  }],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024"
}
```

C. Redis as BullMQ & Socket.IO Adapter

```javascript
// In backend entry point
const redisOptions = { host: process.env.REDIS_HOST, port: 6379 };

// BullMQ queues
const queues = {
  pdf: new Queue('pdf-generation', { connection: redisOptions }),
  notifications: new Queue('notifications', { connection: redisOptions }),
  printer: new Queue('printer', { connection: redisOptions }),
  loyalty: new Queue('loyalty', { connection: redisOptions }),
  reports: new Queue('report-generation', { connection: redisOptions })
};

// Socket.IO with Redis adapter
const io = new Server(server, { 
  adapter: createAdapter(redisOptions),
  cors: { origin: process.env.FRONTEND_URL }
});
```

D. Printer Integration

```javascript
// Printer service using node-thermal-printer or direct socket
class PrinterService {
  async printReceipt(orderData, printerIP) {
    const job = await printerQueue.add('print', { 
      orderId: orderData._id,
      printerIP,
      receiptData: orderData 
    }, { 
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
    return job.id;
  }
}
```

E. Environment Separation Checklist

Item Dev Staging Prod
MongoDB URI mongodb://localhost Atlas M10 (shared) Atlas M30 (dedicated)
Redis URL localhost:6379 Upstash free ElastiCache t3.small
S3 bucket restomanager-dev-docs restomanager-stg-docs restomanager-prod-docs
Log retention 7 days 14 days 30 days
Backup frequency none daily snapshots continuous + daily
API rate limits 500 req/min 1000 req/min 100 req/min per user
Printer integration Simulated Test printer Production printers
FCM notifications Dev project Staging project Production project

---

Document prepared for RestoManager – Infrastructure Team
Version 1.0 – compliant with architecture.md specifications