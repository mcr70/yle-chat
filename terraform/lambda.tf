data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-src/yle"
  output_path = "${path.module}/lambda_edge_cookie_fix.zip"
}

data "archive_file" "hn_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-src/hn"
  output_path = "${path.module}/hn_lambda_edge_cookie_fix.zip"
}


# ---  IAM Role and policy for Lambda@Edgea  -----------------------------
resource "aws_iam_role" "cookie_fix_lambda_role" {
  name = "CookieFixLambdaRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com", 
          ]
        }
      },
    ]
  })
}


resource "aws_iam_role_policy" "cookie_fix_lambda_policy" {
  name = "CookieFixLambdaPolicy"
  role = aws_iam_role.cookie_fix_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Effect = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
    ]
  })
}

// -----------------------------------------------------------------------

provider "aws" { # Lambda@Edge must be created at us-east-1
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_lambda_function" "cookie_fix_lambda" {
  provider         = aws.us_east_1 

  filename         = "lambda_edge_cookie_fix.zip"
  function_name    = "CloudFrontCookieFixer"
  role             = aws_iam_role.cookie_fix_lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  timeout          = 5 # Smallest possible, changes only headers

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  publish = true
}

# HN has distinct session and redirect behavior, so keep its edge logic separate from Yle's.
resource "aws_lambda_function" "hn_cookie_fix_lambda" {
  provider         = aws.us_east_1

  filename         = data.archive_file.hn_lambda_zip.output_path
  function_name    = "HnCloudFrontCookieFixer"
  role             = aws_iam_role.cookie_fix_lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  timeout          = 5

  source_code_hash = data.archive_file.hn_lambda_zip.output_base64sha256

  publish = true
}

resource "aws_cloudwatch_log_group" "cookie_fix_log_group_us_east_1" {
  provider = aws.us_east_1 
  name              = "/aws/lambda/${aws_lambda_function.cookie_fix_lambda.function_name}"
  
  retention_in_days = 1 // Minimize retention
}

resource "aws_cloudwatch_log_group" "hn_cookie_fix_log_group_us_east_1" {
  provider          = aws.us_east_1
  name              = "/aws/lambda/${aws_lambda_function.hn_cookie_fix_lambda.function_name}"
  retention_in_days = 1
}