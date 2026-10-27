variable "region" {
  default = "us-east-1"
}

variable "project" {
  default = "careconnect"
}

variable "image_tag" {
  description = "Immutable image tag published by GitHub Actions"
}

variable "oidc_issuer" {
  description = "HTTPS Keycloak realm issuer; provision your cloud identity provider before deploying"
}

variable "api_hostname" {
  description = "DNS name for the API ALB, e.g. api.example.com"
}

variable "api_certificate_arn" {
  description = "ACM certificate in the selected AWS region for api_hostname"
}

variable "route53_zone_id" {
  description = "Existing public hosted zone for API DNS"
}

variable "frontend_hostname" {
  default     = ""
  description = "Optional custom frontend hostname"
}

variable "frontend_certificate_arn" {
  default     = ""
  description = "ACM certificate in us-east-1 for optional frontend hostname"
}

variable "desired_count" {
  default = 1
}

variable "db_deletion_protection" {
  default = true
}

