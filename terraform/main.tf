terraform {
  required_version = ">= 1.9.2"

  backend "s3" {
    bucket               = "156779480692-terraform-state"
    key                  = "yle-chat"
    region               = "eu-north-1"
    workspace_key_prefix = "env"
  }

  required_providers {
    aws = {
      version = "~> 6.0"
      source  = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
