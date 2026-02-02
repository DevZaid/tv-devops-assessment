# TypeScript Express App on AWS ECS

This project deploys a TypeScript Express application to AWS ECS using Infrastructure as Code (CDKTF) and includes CI/CD automation via GitHub Actions.

## Project Structure

```
tv-devops-assessment/
├── APP/                    # Application code and Docker setup
│   ├── src/
│   │   ├── app.ts         # Express application
│   │   └── server.ts      # Server entry point
│   ├── Dockerfile         # Docker configuration
│   ├── package.json       # Node.js dependencies
│   └── tsconfig.json      # TypeScript configuration
├── IAC/                   # Infrastructure as Code
│   ├── main.ts           # CDKTF infrastructure definition
│   ├── package.json      # CDKTF dependencies
│   └── cdktf.json        # CDKTF configuration
├── .github/workflows/
│   └── deploy.yml        # CI/CD automation
└── .env                  # Environment variables
```

## Prerequisites

1. **AWS Account** with programmatic access
2. **AWS CLI** installed and configured (`aws configure`)
3. **Docker** installed and running
4. **Node.js** (v18 or v20) installed
5. **Git** for version control

## Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd tv-devops-assessment
   ```

2. **Configure environment variables:**
   Update `.env` file with your values:
   ```
   PORT=3000
   AWS_REGION=eu-north-1
   APP_NAME=typescriptapp
   MEMORY=512
   CONTAINER_PORT=3000
   CPU=256
   ```

## Local Development

1. **Install application dependencies:**
   ```bash
   cd APP
   npm install
   ```

2. **Run locally:**
   ```bash
   npm run dev
   ```
   App will be available at `http://localhost:3000`

3. **Build Docker image:**
   ```bash
   docker build -t typeapp .
   ```

4. **Test Docker container:**
   ```bash
   docker run -p 3001:3000 typeapp
   ```

## AWS Infrastructure Deployment

### Step 1: Setup Infrastructure Code

1. **Install CDKTF dependencies:**
   ```bash
   cd IAC
   npm install
   ```

2. **Install CDKTF CLI globally:**
   ```bash
   npm install -g cdktf-cli
   ```

### Step 2: Deploy Infrastructure

1. **Synthesize Terraform code:**
   ```bash
   npx cdktf synth
   ```

2. **Deploy to AWS:**
   ```bash
   npx cdktf deploy
   ```
   This creates:
   - ECS Cluster (`typescriptapp-cluster`)
   - ECS Service and Task Definition
   - Security Group (allows port 3000)
   - IAM Role for ECS execution
   - Uses default VPC and subnets

### Step 3: Deploy Application

1. **Authenticate Docker to ECR:**
   ```bash
   aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 090618480202.dkr.ecr.eu-north-1.amazonaws.com
   ```

2. **Tag and push Docker image:**
   ```bash
   cd APP
   docker tag typeapp:latest 090618480202.dkr.ecr.eu-north-1.amazonaws.com/typescriptapp:latest
   docker push 090618480202.dkr.ecr.eu-north-1.amazonaws.com/typescriptapp:latest
   ```

3. **Verify deployment:**
   - Go to AWS ECS Console
   - Navigate to Clusters → `typescriptapp-cluster` → Services
   - Check that `typescriptapp-service` is RUNNING
   - Get the public IP from the task details
   - Access your app at `http://<public-ip>:3000`

## CI/CD Setup (GitHub Actions)

### Step 1: Configure GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

| Secret Name | Value |
|------------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `AWS_REGION` | `eu-north-1` |
| `APP_NAME` | `typescriptapp` |
| `CPU` | `256` |
| `MEMORY` | `512` |
| `CONTAINER_PORT` | `3000` |

### Step 2: Enable Automatic Deployment

The workflow (`.github/workflows/deploy.yml`) automatically triggers on pushes to the `main` branch and:

1. Builds the Docker image
2. Pushes to ECR
3. Deploys infrastructure via CDKTF
4. Updates ECS service

**To trigger deployment:**
```bash
git add .
git commit -m "Deploy to ECS"
git push origin main
```


## ⚠️ Remote State S3 Bucket Required

Before running the GitHub Actions workflow or deploying with CDKTF, you must create the S3 bucket specified in your remote backend configuration. This bucket is used to store the Terraform state file and is required for successful deployments. The bucket name and region should match those configured in your IAC stack and workflow.

## Important Configuration Details

- **AWS Account ID**: `090618480202`
- **AWS Region**: `eu-north-1` (Stockholm)
- **ECS Cluster**: `typescriptapp-cluster`
- **ECR Repository**: `typescriptapp`
- **Application Port**: `3000`
- **ECS Configuration**: Fargate, 256 CPU, 512 MB memory

## Troubleshooting

### Common Issues:

1. **CDKTF CLI not found:**
   ```bash
   npm install -g cdktf-cli
   ```

2. **Docker login fails:**
   - Verify AWS credentials with `aws sts get-caller-identity`
   - Ensure correct region in commands

3. **ECS service fails to start:**
   - Check ECS logs in AWS Console
   - Verify Docker image exists in ECR
   - Check security group allows port 3000

4. **CI/CD fails:**
   - Verify all GitHub secrets are set correctly
   - Check GitHub Actions logs for specific errors

### Cleanup Resources

To destroy all AWS resources:
```bash
cd IAC
npx cdktf destroy
```

## Application Access

Once deployed successfully:
1. Go to AWS ECS Console
2. Find your cluster → service → tasks
3. Get the public IP from the running task
4. Access: `http://<public-ip>:3000`

## Architecture

- **Frontend**: TypeScript Express API
- **Container**: Docker with Node.js 20 Alpine
- **Orchestration**: AWS ECS Fargate
- **Networking**: Default VPC with public subnets
- **Security**: Security group allowing port 3000
- **CI/CD**: GitHub Actions with automated ECR push and ECS deployment

---

For questions or issues, check the AWS ECS console logs and GitHub Actions workflow logs for detailed error messages.