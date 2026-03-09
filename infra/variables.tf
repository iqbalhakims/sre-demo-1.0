variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "sgp1"
}

variable "cluster_name" {
  description = "DOKS cluster name"
  type        = string
  default     = "sre-demo"
}

variable "k8s_version" {
  description = "Kubernetes version slug (run: doctl kubernetes options versions)"
  type        = string
  default     = "1.32"
}

variable "node_size" {
  description = "Droplet size for worker nodes"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "node_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 2
}

variable "registry_name" {
  description = "DigitalOcean Container Registry name (must be globally unique)"
  type        = string
  default     = "sre-demo-registry"
}

variable "db_user" {
  description = "PostgreSQL username"
  type        = string
  default     = "notesuser"
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "notesdb"
}

variable "frontend_image" {
  description = "Full image reference for frontend (registry.digitalocean.com/<registry>/<image>:<tag>)"
  type        = string
  default     = "notes-frontend:latest"
}

variable "backend_image" {
  description = "Full image reference for backend (registry.digitalocean.com/<registry>/<image>:<tag>)"
  type        = string
  default     = "notes-backend:latest"
}
