# AWS CI/CD Setup Instructions

## 🚀 Complete CI/CD Pipeline Setup

Your GitHub Actions workflow is ready! Follow these steps to complete the setup:

### Step 1: Create IAM User for GitHub Actions

1. **Go to AWS IAM Console**
   - Navigate to IAM → Users → Create user
   - User name: `github-actions-enscribe-web`
   - Access type: Programmatic access

2. **Attach Policy**
   - Create policy using `aws-iam-policy.json` in this repo
   - Or attach the policy JSON directly to the user

3. **Save Credentials**
   - Save the Access Key ID and Secret Access Key
   - You'll need these for GitHub Secrets

### Step 2: Configure GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```
AWS_ACCESS_KEY_ID: [Your IAM user access key]
AWS_SECRET_ACCESS_KEY: [Your IAM user secret key]
```

### Step 3: Test Your Pipeline

1. **Commit and push** these changes to the main branch
2. **Check Actions tab** in GitHub to see the deployment running
3. **Visit your site** at: https://d2okt95q961mml.cloudfront.net

### Step 4: Manual Deployment (if needed)

You can also deploy manually:
```bash
# Deploy to S3 and invalidate CloudFront
npm run deploy:full

# Or step by step
npm run deploy:s3
npm run deploy:cloudfront
```

## 📋 Your Deployment Info

- **S3 Bucket**: `enscribe-web-prod-static`
- **CloudFront Distribution**: `ERTMP9FOP3O1Q`
- **Live URL**: https://d2okt95q961mml.cloudfront.net
- **GitHub Actions**: Automatic on push to main branch

## 🔧 Caching Strategy

- **Static assets** (JS, CSS, images): 1 year cache
- **HTML files**: No cache (immediate updates)
- **CloudFront invalidation**: Clears cache on each deployment

## ⚡ Next Steps

1. Set up custom domain (optional)
2. Configure Route 53 DNS (optional)
3. Add SSL certificate for custom domain (optional)
4. Set up staging environment (optional)

Your CI/CD pipeline is now ready! 🎉