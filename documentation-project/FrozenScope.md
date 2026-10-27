# Frozen scope · CareConnect 1.0.0

This is the agreed project scope with concrete implementation locations. A frozen scope does not mean every integration is account-configured or production-certified.

| Skill | Source / evidence |
|---|---|
| Java 21, OOP, collections, streams, exceptions | Maven Java target; typed entities/records/services; controller filtering/mapping and business validation |
| Concurrency | Database unique-slot guards, optimistic @Version, outbox SKIP LOCKED; no arbitrary async thread pool |
| Spring Boot / MVC / validation | All springboot service modules; annotated REST request DTOs |
| REST / JSON / DTO / errors / versioning | `/api/v1` controllers; RestExceptionHandler; OpenApiConfiguration |
| Pagination / filtering / sorting | Repository Page queries; bounded server page sizes; deterministic server sort; UI pages and status/search filters |
| React / TypeScript / HTML / CSS / Material UI | ReactMain, ReactApp, TypeScriptModels, cssCareConnect, index.html |
| Accessibility / responsive UI | Associated form labels, semantic tables, keyboard focus, mobile navigation, reduced-motion CSS; no formal WCAG certification |
| Redux Toolkit / RTK Query | ReduxStore and ReduxApi; mutations invalidate tags to refresh affected screens |
| PostgreSQL / SQL / joins / indexes | Flyway schema, contacts foreign key and ORM join; slot and lookup indexes; PostgresQueryAnalysis.sql |
| JPA / Hibernate / Flyway | Patient/contact one-to-many and many-to-one; lazy mapping inside transaction; versioned migrations |
| Spring Security / OAuth2 / OIDC / JWT / PKCE | Common security configuration, Keycloak realm, RestAuth; issuer and audience validation |
| Role/ownership access / CORS | Method guards, ownership beans, per-owner list filtering; same-origin proxy architecture |
| Microservices / separate databases / gateway | Four services plus gateway; Compose DBs and separate RDS instances |
| Synchronous communication | RestPatientClient forwards caller token with timeouts |
| Third-party API / response mapping | RestProviderClient (NPPES), RestEmailDelivery (Resend); live execution requires setup |
| Insurance eligibility | Explicit simulation only; no real payer integration |
| Kafka / notifications / DLT | Outbox publisher, notification listener, retry configuration, topics |
| Resilience / idempotency | Provider circuit breaker / bounded read retry, booking request hash/key, email event key |
| Redis / cache invalidation | TTL-based directory cache; UI RTK Query mutation invalidation; no patient-data Redis cache |
| Audit / status / timezone rules | Atomic appointment audit, validated transitions, UTC slot storage, local display |
| JUnit / Mockito / Spring Boot Test | Appointment unit tests and MVC security tests |
| Testcontainers | Real PostgreSQL migration / unique-slot test, skipped when Docker unavailable |
| WireMock / contract tests | Patient REST authorization header and response contract test |
| Vitest / React Testing Library | Demo booking/eligibility tests and patient screen rendering |
| Playwright | Mobile navigation, eligibility UI and full booking/cancellation workflows |
| k6 | Read-load script with thresholds; not a claimed performance benchmark |
| Maven / npm / Git / GitHub | Parent reactor, package lock, .gitignore, CI/release workflows |
| Docker / Compose | Service Dockerfiles, nginx UI image, seeded local infrastructure |
| AWS / Terraform | ECS Fargate, ECR, RDS, Redis, MSK, S3, CloudFront, ALB, Route53, ACM references, IAM, Secrets Manager, CloudWatch |
| CI/CD / scanning / SonarQube | Test workflow, Trivy gates, optional configured Sonar, explicit immutable-image publish/deploy |
| Structured logging / metrics / tracing | Correlation filter, Logback structured config, Actuator/Micrometer, OTel collector, Tempo, Prometheus/Grafana |
| Backup / rollback / configuration | Terraform RDS backup policy and AWS runbook; not a completed DR exercise |
| Documentation / learning | README, architecture decisions, API guide, AWS runbook, seven-day route, verification record |

## Intentionally outside this release

Real patient information, actual insurance coverage decisions, real-time doctor calendars, clinical advice, payments/claims adjudication, production compliance certification, multi-region failover, and proof of production scale. Kubernetes, GraphQL, and Angular are not added to the agreed React project.

## Known limitations to explain honestly

Staff/admin role enforcement is implemented, but there is no separate admin user-management UI: identity/role administration uses Keycloak. Patient registration and identity registration are separate steps. Directory entries do not validate clinician credentials or availability. AWS identity hosting, cloud metrics/traces, live provider access, and email account setup are documented prerequisites. The deployment template uses master database credentials in managed secrets for simplicity; use least-privilege app users before production. Email pending retries have no maximum attempt count. UI patient selectors load up to 100 records and would need server-side autocomplete for a larger directory. Dashboard counts explicitly describe the loaded schedule or latest 50 results, rather than claiming global analytics.
