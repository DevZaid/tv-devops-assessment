# Issues & Solutions - AWS ECS Deployment with CDKTF

## 1. CDKTF Provider Version Mismatch
**Issue:** Import errors due to incompatible `@cdktf/provider-aws` and `cdktf` versions.  
**Solution:** Aligned versions in `IAC/package.json`:
- `cdktf: ^0.20.12`
- `@cdktf/provider-aws: ^19.65.1`
- `constructs: ^10.4.5`

---

## 2. Docker Build Failing
**Issue:** Missing `build` script and incorrect `tsconfig.json` location in APP folder.  
**Solution:** Added build/start scripts to `APP/package.json` and placed `tsconfig.json` in `APP/` directory.

---

## 3. Duplicate Resource Errors in CI/CD
**Issue:** Terraform tried to create resources that already existed in AWS.
```
Error: EntityAlreadyExists: Role with name xxx-task-role already exists
Error: InvalidGroup.Duplicate: The security group 'xxx-sg' already exists
```
**Cause:** Terraform state didn't know about existing AWS resources.  
**Solution:** 
1. Configured S3 backend for remote state in `IAC/main.ts`
2. Added import logic in workflow to import existing resources before apply

---

## 4. "Resource Already Managed" During Import
**Issue:** Import commands failed because resources were already in Terraform state.
```
Error: Terraform is already managing a remote object for aws_iam_role.ecsTaskRole
```
**Solution:** Added state check before importing:
```bash
if ! terraform state show aws_iam_role.ecsTaskRole >/dev/null 2>&1; then
  terraform import aws_iam_role.ecsTaskRole "role-name"
fi
```

---

## 5. ECS Service Not Imported
**Issue:** ECS service existed in AWS but wasn't in Terraform state.
```
Error: Creation of service was not idempotent
```
**Solution:** Added ECS service import with correct format:
```bash
terraform import aws_ecs_service.service "cluster-name/service-name"
```

---

## 6. Invalid Backend Configuration
**Issue:** `-backend-config` flags failed because CDKTF used local backend by default.
```
Error: Invalid backend configuration argument "bucket"
```
**Solution:** Configured S3 backend directly in CDKTF code (`main.ts`):
```typescript
new S3Backend(this, {
  bucket: 'app-terraform-state',
  key: 'terraform.tfstate',
  region: 'eu-north-1',
});
```

---

## 7. Terraform CLI Missing in CI/CD
**Issue:** CDKTF requires Terraform CLI but it wasn't installed.  
**Solution:** Added Terraform setup step in workflow:
```yaml
- name: Setup Terraform
  uses: hashicorp/setup-terraform@v3
  with:
    terraform_version: "1.6.6"
```

---

## 8. ECS Not Pulling New Docker Image
**Issue:** After pushing new image, ECS didn't automatically deploy it.  
**Solution:** Added force deployment step:
```yaml
- name: Force ECS service update
  run: |
    aws ecs update-service \
      --cluster ${{ env.APP_NAME }}-cluster \
      --service ${{ env.APP_NAME }}-service \
      --force-new-deployment
```

---

## Key Takeaways

| Problem | Root Cause | Fix |
|---------|------------|-----|
| Duplicate resources | No remote state | Use S3 backend |
| Import fails | Resource already in state | Check state before import |
| Version errors | Dependency mismatch | Pin compatible versions |
| CI/CD state drift | Local state per run | Remote S3 state |

---

## Required GitHub Secrets
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
APP_NAME
CPU
MEMORY
CONTAINER_PORT
```

## Prerequisites
1. Create S3 bucket: `{APP_NAME}-terraform-state`
2. Create ECR repository: `{APP_NAME}`
3. Configure GitHub secrets
