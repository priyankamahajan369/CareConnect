# AWS deployment runbook

## Prerequisites and limits

Nothing in this ZIP has been deployed to your AWS account. This Terraform template creates billable VPC/NAT, ALB, ECS/Fargate, ECR, four RDS databases, ElastiCache, MSK, CloudWatch, S3, CloudFront, and Route 53 records. Review prices, region availability, quotas, and your budget first. The template is a learning baseline, not a production compliance architecture.

Provide an AWS account, region, an existing Route 53 hosted zone, a matching ACM certificate for the API hostname, and an externally hosted **HTTPS Keycloak** instance. Import the realm, replace all demo accounts/passwords, and configure its public client redirect URI and web origin to the actual CloudFront or frontend domain. Use a valid `careconnect-api` audience mapper. The Terraform template does not provision cloud Keycloak.

For a custom frontend hostname, supply a matching ACM certificate in us-east-1 and `frontend_hostname`. Otherwise use the default CloudFront domain. The API certificate must be in the deployment region.

The default single-node Redis, single ECS task per service, and two MSK brokers optimize learning scope. They are not an HA/DR claim. MSK uses private network TLS without IAM client authentication; Redis uses TLS and restricted security groups. Add client authentication, stronger least-privilege app database roles, multi-AZ capacity, WAF, alerts, retention, and recovery drills for a production design.

## Bootstrap sequence

1. Install Terraform >=1.10, AWS CLI, Docker, JDK 21, Maven, Node 22.12+. Authenticate through an authorized local AWS profile; do not paste account keys into code.
2. Create a private encrypted S3 Terraform state bucket with versioning. This state bucket is external to this template. GitHub Actions uses S3 lockfiles. Set restrictive access; never commit state or plan files.
3. Create a `terraform-backend.tf` locally with `terraform { backend "s3" {} }`, then initialize using your bucket, region, and `key=careconnect/terraform.tfstate`. The GitHub deployment workflow writes this same backend declaration at runtime.
4. Copy `terraform-example.tfvars` to a private `.tfvars` file and fill real domain/certificate/issuer values. Set region consistently with AWS_REGION.
5. Bootstrap only the ECR repositories with `terraform apply -target=aws_ecr_repository.service -var-file=your-private.tfvars`. Resource targeting is solely a first-time bootstrap step; subsequent deployments use a full plan.
6. Push this source to your own private or public GitHub repository. Configure the `aws` environment, scoped OIDC IAM role, and variables listed below. Run the **Build and release AWS images** workflow. It tests, builds, scans, and publishes each service under the Git commit SHA.
7. Set `image_tag` to that published SHA, run `terraform plan`, review it, and apply. RDS uses AWS-managed master passwords; task definitions read only their own database secret. Services discover each other through private Cloud Map DNS.
8. Build the UI with `VITE_MODE=live` and `VITE_KEYCLOAK_URL=https://your-keycloak-host`. Upload `dist` to the Terraform output bucket and invalidate CloudFront, or run the deployment workflow after configuration.
9. Confirm target-group health, ECS logs, OIDC login, read and booking flows, ownership rejection, event delivery, and API error behavior through CloudFront. Do not claim cloud success before these checks pass.

All cloud services use INTEGRATION_MODE=mock by default. To test public NPPES / email from AWS, add controlled task environment changes and grant the notification execution role access to a dedicated email API secret; do not inject it into frontend builds. The supplied Terraform does not create or populate a live email secret.

## GitHub configuration

Create a GitHub AWS OIDC provider and a role whose trust policy binds `token.actions.githubusercontent.com:sub` to `repo:YOUR_ORG/YOUR_REPO:environment:aws` and audience `sts.amazonaws.com`. Grant only the required project resources; the bootstrap administrator must review the resulting Terraform plan and IAM changes.

Variables: `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `TF_STATE_BUCKET`, `OIDC_ISSUER`, `KEYCLOAK_URL`, `API_HOSTNAME`, `API_CERTIFICATE_ARN`, `ROUTE53_ZONE_ID`. Optional SonarQube: `SONAR_HOST_URL` variable and `SONAR_TOKEN` secret. If using a custom frontend domain, extend the workflow's TF_VAR configuration with the two documented frontend variables.

`github-ci.yml` runs Java tests (including Testcontainers on GitHub's Docker runner), React tests, browser tests, and filesystem scans. Sonar runs only when configured. `github-release.yml` publishes immutable backend images and scans each image. `github-deploy.yml` is manually dispatched with a published image tag and applies a saved plan to the configured remote state, then publishes the frontend. No deployment runs automatically on a normal push.

Configure your environment's deployment rules and OIDC IAM permissions to match your account's practices. Third-party Actions are version-tag pinned; an organizational hardening step should pin reviewed commit SHAs.

## Monitoring and recovery

CloudWatch receives ECS logs and container insights. Local Prometheus/Grafana/Tempo configuration is in the ZIP. The Terraform baseline does **not** deploy these three monitoring servers or an OTel collector in AWS; supply a reachable OTLP endpoint for cloud traces and a managed metrics strategy. Its default local OTLP URL will not receive cloud traces.

Rollback: redeploy a previously published image SHA through Terraform and wait for ECS stable services. ECS deployment circuit breakers are enabled. Database migrations are forward-only: do not assume an application rollback can undo a schema change. Use expand/contract changes and test compatibility.

RDS keeps seven days of automated backups and requires final snapshots on deletion. A restore creates new endpoints: update configuration, migrate traffic, and verify. This template does not demonstrate cross-region failover or tested RPO/RTO.

Cleanup: save any required snapshots, remove frontend bucket objects/versions, deliberately disable DB deletion protection only when you intend deletion, then review a `terraform destroy` plan. Do not delete the remote state bucket before resources are removed. NAT, MSK, databases, and ALB incur charges while idle.
