locals {
  api_origins = {
    YleCommentsV1Origin = { // Reply, like/unlike needs POST
      domain          = "comments.api.yle.fi"
      path_pattern    = "/v1/topics/*"
      allowed_methods = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    },
    YleCommentsV2Origin = {
      domain          = "comments.api.yle.fi"
      path_pattern    = "/v2/topics/*"
      allowed_methods = [ "GET", "HEAD", "OPTIONS" ]
    },
    YleHistoryApiOrigin = {
      domain       = "datacloud.api.yle.fi",
      path_pattern = "/v2/tv/history*"
      allowed_methods = [ "GET", "HEAD", "OPTIONS" ]
    },
    YleLoginApiOrigin = { // Needs POST
      domain       = "login.api.yle.fi" 
      path_pattern = "/v1/user/*"
      allowed_methods = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    }
  }
}

###  CloudFront Distribution  ##############################################

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "OAC-for-${var.bucket_name}"
  description                       = "OAC to allow CloudFront to access S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}


###  CloudFront Distribution (CDN)
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CDN for yle-chat in ${var.bucket_name}"
  default_root_object = "index.html"

  # 1. Origin for Static Content (Angular files in S3)
  origin {
    domain_name              = aws_s3_bucket.website_bucket.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.website_bucket.id

    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  // Default behavior for S3 origin
  default_cache_behavior { 
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = aws_s3_bucket.website_bucket.id

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600 # 1 hour
    max_ttl                = 86400

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }


  # Dynamic origins for APIs
  dynamic "origin" {
    for_each = local.api_origins

    content {
      origin_id   = origin.key 
      domain_name = origin.value.domain 

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }  

  dynamic "ordered_cache_behavior" {
    for_each = local.api_origins

    content {
      path_pattern     = ordered_cache_behavior.value.path_pattern
      target_origin_id = ordered_cache_behavior.key

      allowed_methods  = ordered_cache_behavior.value.allowed_methods
      cached_methods   = ["GET", "HEAD", "OPTIONS"]
      
      viewer_protocol_policy = "https-only"
      
      forwarded_values {
        query_string = true
        headers      = ["Authorization", "Origin", "User-Agent", "Referer"]
        
        cookies {
          forward = "all"
        }
      }


      dynamic "lambda_function_association" {
        for_each = ordered_cache_behavior.key == "YleLoginApiOrigin" ? [1] : []

        content {
          event_type   = "origin-response" # Change response before it is sent to browser
          lambda_arn   = aws_lambda_function.cookie_fix_lambda.qualified_arn 
          include_body = false
        }
      }

      min_ttl     = 0
      default_ttl = 0
      max_ttl     = 0
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist" // To allow from everywhere, type "none"
      locations        = ["FI"] // Allow only Finland
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}