# -------------------------------------------------------------------
# Container Registry
# -------------------------------------------------------------------
resource "digitalocean_container_registry" "main" {
  name                   = var.registry_name
  subscription_tier_slug = "basic"
  region                 = var.region
}

# Grant the cluster pull access to the registry
resource "digitalocean_container_registry_docker_credentials" "main" {
  registry_name = digitalocean_container_registry.main.name
}

# -------------------------------------------------------------------
# DOKS Cluster
# -------------------------------------------------------------------
resource "digitalocean_kubernetes_cluster" "main" {
  name    = var.cluster_name
  region  = var.region
  version = data.digitalocean_kubernetes_versions.main.latest_version

  node_pool {
    name       = "worker-pool"
    size       = var.node_size
    node_count = var.node_count

    labels = {
      env = "production"
    }
  }
}

data "digitalocean_kubernetes_versions" "main" {
  version_prefix = "${var.k8s_version}."
}

# -------------------------------------------------------------------
# Namespace
# -------------------------------------------------------------------
resource "kubernetes_namespace" "notes_app" {
  metadata {
    name = "notes-app"
  }

  depends_on = [digitalocean_kubernetes_cluster.main]
}

# -------------------------------------------------------------------
# Registry pull secret
# -------------------------------------------------------------------
resource "kubernetes_secret" "registry_credentials" {
  metadata {
    name      = "do-registry"
    namespace = kubernetes_namespace.notes_app.metadata[0].name
  }

  type = "kubernetes.io/dockerconfigjson"

  data = {
    ".dockerconfigjson" = digitalocean_container_registry_docker_credentials.main.docker_credentials
  }
}

# -------------------------------------------------------------------
# PostgreSQL secret
# -------------------------------------------------------------------
resource "kubernetes_secret" "postgres" {
  metadata {
    name      = "postgres-secret"
    namespace = kubernetes_namespace.notes_app.metadata[0].name
  }

  data = {
    POSTGRES_USER     = var.db_user
    POSTGRES_PASSWORD = var.db_password
    POSTGRES_DB       = var.db_name
  }
}

# -------------------------------------------------------------------
# Backend ConfigMap
# -------------------------------------------------------------------
resource "kubernetes_config_map" "backend" {
  metadata {
    name      = "backend-config"
    namespace = kubernetes_namespace.notes_app.metadata[0].name
  }

  data = {
    DB_HOST = "postgres-svc"
    DB_PORT = "5432"
    DB_NAME = var.db_name
    NODE_ENV = "production"
  }
}

# -------------------------------------------------------------------
# PostgreSQL StatefulSet
# -------------------------------------------------------------------
resource "kubernetes_stateful_set" "postgres" {
  metadata {
    name      = "postgres"
    namespace = kubernetes_namespace.notes_app.metadata[0].name
  }

  spec {
    service_name = "postgres-svc"
    replicas     = 1

    selector {
      match_labels = {
        app = "postgres"
      }
    }

    template {
      metadata {
        labels = {
          app = "postgres"
        }
      }

      spec {
        container {
          name  = "postgres"
          image = "postgres:16-alpine"

          port {
            container_port = 5432
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.postgres.metadata[0].name
            }
          }

          volume_mount {
            name       = "postgres-data"
            mount_path = "/var/lib/postgresql/data"
            sub_path   = "postgres"
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }
        }
      }
    }

    volume_claim_template {
      metadata {
        name = "postgres-data"
      }

      spec {
        access_modes       = ["ReadWriteOnce"]
        storage_class_name = "do-block-storage"

        resources {
          requests = {
            storage = "5Gi"
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "postgres" {
  metadata {
    name      = "postgres-svc"
    namespace = kubernetes_namespace.notes_app.metadata[0].name
  }

  spec {
    selector = {
      app = "postgres"
    }

    port {
      port        = 5432
      target_port = 5432
    }

    cluster_ip = "None" # headless service for StatefulSet
  }
}

# -------------------------------------------------------------------
# Backend Deployment
# -------------------------------------------------------------------
resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.notes_app.metadata[0].name
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "backend"
      }
    }

    template {
      metadata {
        labels = {
          app  = "backend"
          tier = "backend"
        }
      }

      spec {
        image_pull_secrets {
          name = kubernetes_secret.registry_credentials.metadata[0].name
        }

        container {
          name  = "backend"
          image = var.backend_image

          port {
            container_port = 3000
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.backend.metadata[0].name
            }
          }

          env {
            name = "DB_USER"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.postgres.metadata[0].name
                key  = "POSTGRES_USER"
              }
            }
          }

          env {
            name = "DB_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.postgres.metadata[0].name
                key  = "POSTGRES_PASSWORD"
              }
            }
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 15
            period_seconds        = 10
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "64Mi"
            }
            limits = {
              cpu    = "200m"
              memory = "256Mi"
            }
          }
        }
      }
    }
  }

  depends_on = [kubernetes_stateful_set.postgres]
}

resource "kubernetes_service" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.notes_app.metadata[0].name
  }

  spec {
    selector = {
      app = "backend"
    }

    port {
      port        = 3000
      target_port = 3000
    }
  }
}

# -------------------------------------------------------------------
# Frontend Deployment
# -------------------------------------------------------------------
resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.notes_app.metadata[0].name
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "frontend"
      }
    }

    template {
      metadata {
        labels = {
          app  = "frontend"
          tier = "frontend"
        }
      }

      spec {
        image_pull_secrets {
          name = kubernetes_secret.registry_credentials.metadata[0].name
        }

        container {
          name  = "frontend"
          image = var.frontend_image

          port {
            container_port = 80
          }

          readiness_probe {
            http_get {
              path = "/"
              port = 80
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }

          resources {
            requests = {
              cpu    = "20m"
              memory = "32Mi"
            }
            limits = {
              cpu    = "100m"
              memory = "128Mi"
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.notes_app.metadata[0].name
    annotations = {
      "kubernetes.digitalocean.com/load-balancer-id" = "frontend-lb"
    }
  }

  spec {
    selector = {
      app = "frontend"
    }

    type = "LoadBalancer"

    port {
      port        = 80
      target_port = 80
    }
  }
}
