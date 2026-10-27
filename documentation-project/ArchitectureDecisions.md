# Architecture and decisions

## Boundaries

React calls `/api/v1` through the gateway. Patient Service owns its patients and contacts. Appointment Service owns appointments, audit records, and outbox events. Insurance Service owns verification results and caches provider searches. Notification Service owns a durable inbox. Each service has a separate PostgreSQL database; no service directly queries another service's tables.

## Booking flow

1. React sends a validated JSON booking with a generated Idempotency-Key header.
2. Appointment Service looks up that key. Identical replay returns the original record; a changed body is rejected with 409.
3. A timeout-bounded REST call to Patient Service forwards the caller's JWT. Patient Service authorizes record ownership or a staff role.
4. The service enforces future, fixed 30-minute slots. PostgreSQL partial unique indexes guard both provider and patient conflicts for CONFIRMED appointments.
5. The appointment, audit entry, and outbox event commit in one database transaction.
6. A scheduler claims pending events with `FOR UPDATE SKIP LOCKED`, sends them to Kafka, waits for acknowledgment, and marks them published.
7. Notification Service deduplicates on the event UUID and commits a pending notification. Kafka errors retry three times and then go to `appointment.events.DLT`.
8. A second scheduler sends pending emails through the adapter, using the same UUID as the provider idempotency key. Mock mode marks delivery SIMULATED.

This is **at-least-once delivery**, with deduplication; it does not claim end-to-end exactly once. A broker outage preserves pending outbox rows. A crash after publish but before marking the row can produce the same event again. The inbox ignores events already committed.

## Relationships and consistency

Patient → Contacts is a Hibernate one-to-many mapping. Contact → Patient is a lazy many-to-one with a foreign key. JSON serialization avoids bidirectional recursion. Contacts are mapped to response DTOs inside a read-only transaction.

Appointments carry patient ID plus a display-name/email snapshot. There is no cross-service JPA join or foreign key. Patient name changes do not retroactively rewrite historical appointment snapshots. This is an explicit consistency tradeoff.

Each confirmed slot is exactly 30 minutes. The system does not support arbitrary durations or overlapping interval scheduling. Instant storage is UTC; screens render in the browser's local timezone. Server validation remains authoritative.

Idempotency keys are bound to the booking request hash. Concurrent identical first requests may race into the unique constraint: one succeeds and the other receives 409. Replaying after the winning commit returns the original resource. The UI disables the submit button during an in-flight mutation and deliberately does not blindly retry booking POSTs.

## Security

JWT validation checks signature, expiry, issuer, and `careconnect-api` audience. Keycloak roles become Spring `ROLE_` authorities. Patients can read their own profile and appointments, book for their own patient ID, and cancel their own appointment. Only staff/admin can manage the patient directory, perform insurance checks, view the audit trail, or complete visits. Frontend visibility is convenience; backend rules are enforcement.

The gateway forwards bearer tokens. Each service validates them independently. OIDC tokens are not persisted to localStorage. Browser demo mode has no authentication and is labelled accordingly. CORS is not globally opened: local nginx/Vite and CloudFront use same-origin API routing.

The Compose stack is bound to localhost. Health, metrics, and OpenAPI endpoints are unauthenticated for local observability; keep internal service ports private in AWS. The public gateway does not route internal metrics or Swagger endpoints.

## External systems

The CMS adapter has connect/read timeouts, a circuit breaker, a bounded retry for read-only search, and a short Redis TTL. Registry failure is shown as a request error, rather than fabricated live results. Mock results state their source.

Eligibility is a deterministic adapter simulation. The system does not submit claims, perform payment adjudication, claim regulatory compliance, or decide actual coverage.

Resend is called only when INTEGRATION_MODE=live. External email requests use idempotency keys. Pending rows retry on later scheduler runs; a production rollout should add delivery-attempt limits, operator alerts, provider webhooks, and retention policies.

## Observability and recovery

SLF4J logs use structured JSON. Correlation headers are sanitized. Micrometer supplies JVM and HTTP metrics; OpenTelemetry exports sampled traces to the local collector and Tempo. Grafana provides metrics and a Tempo data source. Do not log patient records, JWTs, or email bodies.

The local environment is a single-node learning deployment, with separate databases on one PostgreSQL server. Local Kafka storage is ephemeral; published-but-unconsumed events can be lost when its container is recreated. Use durable broker volumes for stronger local restart guarantees. Terraform uses separate RDS instances for service ownership. Redis and MSK are private. Terraform's MSK authentication mode is private-network TLS with unauthenticated clients; production hardening should use IAM or mTLS and topic-level controls. Redis uses transport encryption and security-group restrictions; production hardening should add Redis ACLs. Default single-task ECS and single-node Redis do not provide high availability. These limits are deliberate and visible.

## Cloud verification boundary

Terraform files and workflows are source configuration, not evidence of an AWS deployment. An HTTPS cloud OIDC provider, DNS zone, ACM certificates, GitHub OIDC trust, remote state bucket, permissions, quota, and account billing setup are prerequisites. See AwsDeploymentRunbook.md.
