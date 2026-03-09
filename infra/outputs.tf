output "cluster_id" {
  description = "DOKS cluster ID"
  value       = digitalocean_kubernetes_cluster.main.id
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint"
  value       = digitalocean_kubernetes_cluster.main.endpoint
}

output "registry_endpoint" {
  description = "Container registry endpoint"
  value       = "registry.digitalocean.com/${digitalocean_container_registry.main.name}"
}

output "frontend_lb_ip" {
  description = "Frontend LoadBalancer IP (available after service is provisioned)"
  value       = try(kubernetes_service.frontend.status[0].load_balancer[0].ingress[0].ip, "pending")
}

output "kubeconfig" {
  description = "Kubeconfig to access the cluster"
  value       = digitalocean_kubernetes_cluster.main.kube_config[0].raw_config
  sensitive   = true
}
