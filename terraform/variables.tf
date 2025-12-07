variable "bucket_name" {
  description = "Name of the S3 bucket to store angular app files"
  default     = "yle-chat-app-bucket"
  type        = string
}

variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "eu-north-1"
}