# YleChat

## Installing

There is a simple Terraform scripts in `terraform/` directory, which will make a
simple S3 bucket and CloudFront distribution, that can be used for simple installations.

In `terraform/` folder, change `variables.tf` and give your bucket a globally unique name.
After that, run 
```bash
terraform apply
```

Once the bucket and CloudFront distribution is created, build and copy the files into bucket.
You need to setup your cli so that it can upload into s3 bucket
```bash
ng build --configuration=production
aws s3 sync ./dist/yle-chat/browser s3://yle-chat-app-bucket --delete
```

If you need to update the service to S3 bucket, remember that there may be some caching 
involved with Cloudfront. To invalidate Cloudfront cache, you need to figure out your 
distribution ID, and then trigger the invalidation, like this

```bash
aws cloudfront list-distributions --query "DistributionList.Items[*].Id"
[
    "..."
]
aws cloudfront create-invalidation --paths "/*" --distribution-id ...
```
