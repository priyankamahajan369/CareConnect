data "aws_caller_identity" "current" {

}

resource "aws_ecr_repository" "service" {
  for_each             = local.apps
  name                 = "${var.project}-${each.key}"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }


}

resource "aws_cloudwatch_log_group" "service" {
  for_each          = local.apps
  name              = "/ecs/${var.project}/${each.key}"
  retention_in_days = 14
}

resource "aws_ecs_cluster" "main" {
  name = var.project
  setting {
    name  = "containerInsights"
    value = "enabled"
  }

}

resource "aws_service_discovery_private_dns_namespace" "main" {
  name = "careconnect.internal"
  vpc  = aws_vpc.main.id
}

resource "aws_service_discovery_service" "service" {
  for_each = local.apps
  name     = each.key
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }


}

resource "aws_iam_role" "execution" {
  for_each = local.apps
  name     = "${var.project}-${each.key}-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17", Statement = [{
      Effect = "Allow", Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }, Action = "sts:AssumeRole"
    }]
    }
  )
}

resource "aws_iam_role_policy_attachment" "execution" {
  for_each   = local.apps
  role       = aws_iam_role.execution[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "database_secret" {
  for_each = local.services
  role     = aws_iam_role.execution[each.key].id
  policy = jsonencode({
    Version = "2012-10-17", Statement = [{
      Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = aws_db_instance.service[each.key].master_user_secret[0].secret_arn
    }]
    }
  )
}

resource "aws_iam_role" "task" {
  for_each           = local.apps
  name               = "${var.project}-${each.key}-task"
  assume_role_policy = aws_iam_role.execution[each.key].assume_role_policy
}

resource "aws_ecs_task_definition" "service" {
  for_each                 = local.apps
  family                   = "${var.project}-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.execution[each.key].arn
  task_role_arn            = aws_iam_role.task[each.key].arn
  container_definitions = jsonencode([{
    name = each.key, image = "${aws_ecr_repository.service[each.key].repository_url}:${var.image_tag}", essential = true,
    portMappings = [{
      containerPort = 8080, protocol = "tcp"
    }],
    environment = concat([
      {
        name = "PATIENT_URL", value = "http://patient.careconnect.internal:8080"
      },
      {
        name = "APPOINTMENT_URL", value = "http://appointment.careconnect.internal:8080"
      },
      {
        name = "INSURANCE_URL", value = "http://insurance.careconnect.internal:8080"
      },
      {
        name = "NOTIFICATION_URL", value = "http://notification.careconnect.internal:8080"
      },
      {
        name = "OIDC_ISSUER", value = var.oidc_issuer
      },
      {
        name = "OIDC_JWKS", value = "${var.oidc_issuer}/protocol/openid-connect/certs"
      },
      {
        name = "INTEGRATION_MODE", value = "mock"
      },
      {
        name = "REDIS_HOST", value = aws_elasticache_replication_group.redis.primary_endpoint_address
      },
      {
        name = "SPRING_DATA_REDIS_SSL_ENABLED", value = "true"
      },
      {
        name = "KAFKA_BOOTSTRAP", value = aws_msk_cluster.events.bootstrap_brokers_tls
      },
      {
        name = "SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL", value = "SSL"
        }], each.key == "gateway" ? [] : [{
        name = "DB_URL", value = "jdbc:postgresql://${aws_db_instance.service[each.key].endpoint}/${each.key}?sslmode=require"
        }, {
        name = "DB_USER", value = "careconnect"
    }]),
    secrets = each.key == "gateway" ? [] : [{
      name = "DB_PASSWORD", valueFrom = "${aws_db_instance.service[each.key].master_user_secret[0].secret_arn}:password::"
    }],
    logConfiguration = {
      logDriver = "awslogs", options = {
        "awslogs-group" = aws_cloudwatch_log_group.service[each.key].name, "awslogs-region" = var.region, "awslogs-stream-prefix" = "app"
      }

    }

  }])

}

resource "aws_lb" "api" {
  name               = "${var.project}-api"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "gateway" {
  name        = "${var.project}-gateway"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id
  health_check {
    path    = "/actuator/health"
    matcher = "200"
  }

}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.api.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.api_certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.gateway.arn
  }

}

resource "aws_ecs_service" "service" {
  for_each        = local.apps
  name            = "${var.project}-${each.key}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.service[each.key].arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.service[each.key].arn
  }

  dynamic "load_balancer" {
    for_each = each.key == "gateway" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.gateway.arn
      container_name   = "gateway"
      container_port   = 8080
    }

  }

  depends_on = [aws_lb_listener.https, aws_iam_role_policy_attachment.execution, aws_iam_role_policy.database_secret]

}

resource "aws_route53_record" "api" {
  zone_id = var.route53_zone_id
  name    = var.api_hostname
  type    = "A"
  alias {
    name                   = aws_lb.api.dns_name
    zone_id                = aws_lb.api.zone_id
    evaluate_target_health = true
  }

}

