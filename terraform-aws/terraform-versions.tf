terraform {

  required_version = ">= 1.8.0"
  required_providers {
    aws = {
      source = "hashicorp/aws", version = "~> 5.90"
    }

  }

  # Before team use, configure an encrypted remote state backend with locking.

}

provider "aws" {
  region = var.region
}

