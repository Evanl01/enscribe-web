#!/bin/bash

# AWS CloudFront + S3 Deployment Setup
# Run this script to create the necessary AWS infrastructure

set -e

# Configuration - UPDATE THESE VALUES
BUCKET_NAME="enscribe-web-prod"  # Change this to your desired bucket name
REGION="us-east-1"
DOMAIN_NAME="yourdomain.com"     # Optional: your custom domain

echo "🚀 Setting up AWS infrastructure for $BUCKET_NAME..."

# 1. Create S3 bucket
echo "📦 Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION

# 2. Enable static website hosting
echo "🌐 Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document 404.html

# 3. Set public read policy
echo "🔓 Setting bucket policy for public read access..."
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
rm bucket-policy.json

# 4. Create CloudFront distribution
echo "☁️ Creating CloudFront distribution..."
cat > cloudfront-config.json << EOF
{
  "CallerReference": "$(date +%s)",
  "Comment": "EnScribe Web App Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BUCKET_NAME",
        "DomainName": "$BUCKET_NAME.s3-website-$REGION.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "Enabled": true,
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
EOF

DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json)
DISTRIBUTION_ID=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.Id')
DISTRIBUTION_DOMAIN=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.DomainName')

rm cloudfront-config.json

echo "✅ Infrastructure setup complete!"
echo "📦 S3 Bucket: $BUCKET_NAME"
echo "🆔 CloudFront Distribution ID: $DISTRIBUTION_ID"
echo "🌐 CloudFront Domain: $DISTRIBUTION_DOMAIN"
echo ""
echo "📝 Update your package.json deploy scripts with:"
echo "   - Bucket name: $BUCKET_NAME"
echo "   - Distribution ID: $DISTRIBUTION_ID"
echo ""
echo "🔄 CloudFront deployment is in progress (may take 10-15 minutes)"