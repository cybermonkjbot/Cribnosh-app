# CribNosh: Azure Migration Blueprint

This document outlines the strategy for a "downlessly" (zero-downtime) migration from AWS to Microsoft Azure.

## Current State (AWS)
- **Web App**: AWS App Runner (ECRS + Docker)
- **Storage**: S3 (with CloudFront CDN)
- **Secrets**: AWS Secrets Manager
- **Infrastructure**: Terraform (AWS Provider)

## Transition State (Code Readiness)
We have introduced cloud-agnostic abstraction layers:
1. **Storage**: `lib/storage.ts` provides a `StorageProvider` interface.
2. **AI**: `emotions-engine` now includes an `azure-openai` provider and dispatch logic.
3. **Environment**: `CLOUD_PROVIDER` and Azure-specific keys added to `env.template`.

## Migration Strategy (Zero Downtime)

### Phase 1: Data Replication (Dual Write)
1. **Storage**: Implement `AzureStorageProvider` using `@azure/storage-blob`.
2. **Execution**: Temporary "Dual Write" mode where both S3 and Azure Blob receive new files.
3. **Migration**: Use Azure Storage Explorer or Rclone to sync existing S3 data to Azure.

### Phase 2: Infrastructure Parallelism
1. **Deploy**: Use the provided `infrastructure/azure` Terraform to spin up Container Apps.
2. **Sync Secrets**: Replicate AWS Secrets Manager values into Azure Key Vault or Container App Secrets.
3. **Build**: Run the `azure-deploy.yml` workflow to push images to ACR and deploy to Container Apps.

### Phase 3: Traffic Handoff (DNS)
1. **CDN**: Configure Azure Front Door or Application Gateway.
2. **Validation**: Test the Azure environment via a staging URL.
3. **DNS Cutover**: Update Cloudflare CNAME records to point from CloudFront to Azure Front Door.
4. **TTL Monitoring**: Observe traffic shifting seamlessly to Azure.

### Phase 4: Clean Up
1. **Decommission**: Stop AWS App Runner services.
2. **Removal**: Delete S3 buckets and ECR repositories after verification.
3. **Infrastructure**: Remove AWS Terraform providers and configurations.

## Azure Equivalents Reference

| AWS Service | Azure Equivalent |
| --- | --- |
| App Runner | Container Apps |
| ECR | Container Registry (ACR) |
| S3 | Blob Storage |
| CloudFront | Front Door / CDN |
| Secrets Manager | Key Vault / App Configuration |
| IAM | Entra ID / Managed Identities |
| OpenAI (Direct) | Azure OpenAI |
| Lambda (AI hooks) | Azure Functions / AI Services |
