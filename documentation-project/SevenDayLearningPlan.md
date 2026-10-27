# Seven-day guided learning route

The project scope is fixed. Seven days is an intensive introduction and guided implementation review, not mastery of all technologies. Allow 6–8 focused hours each day, plus follow-up practice.

| Day | Read and run | Explain back |
|---|---|---|
| 1 | README, Java models, Spring Boot entry points, REST patient endpoints, Swagger, Postman, Git/Maven | Request → controller → service/repository → response; OOP, exceptions, streams |
| 2 | PostgreSQL migrations, patient/contact relationships, appointment slot indexes, transaction boundaries, idempotency tests | One-to-many, lazy loading, indexes vs application checks, UTC slots, atomic outbox |
| 3 | ReactMain, ReactApp, ReduxStore, ReduxApi, CSS, TypeScript models; book through the UI | React state vs Redux state vs RTK Query cache; form validation, routes, API errors |
| 4 | Keycloak realm, SpringSecurityConfig, ownership checks, gateway, REST patient client | Authentication vs authorization, OAuth2/OIDC/JWT, PKCE, service boundaries and token forwarding |
| 5 | Provider adapter, eligibility simulation, Resend, Redis, Kafka listener, outbox, retries and circuit breaker | Synchronous vs asynchronous calls, timeout vs retry, deduplication, cache invalidation, partial failures |
| 6 | JUnit/Mockito, WireMock contracts, Testcontainers, Vitest, Playwright, k6, Actuator, Prometheus, Grafana, OTel | Which failures each test catches; how to follow a booking across services |
| 7 | Docker Compose, Terraform, GitHub workflows, AWS runbook, rollback / backups | AWS architecture, CI/CD flow, secrets, costs, tradeoffs, and a five-minute truthful project walkthrough |

Each guided session will use a simple story, run a real workflow, inspect the relevant files, change one behavior, debug it, then explain the result in interview language. Cheat sheets will be created later, as requested.

## Five-minute demonstration

1. Explain the problem: fragmented appointment coordination.
2. Show a provider search and patient directory.
3. Book and reject a duplicate slot.
4. Show eligibility clearly marked simulated.
5. Show the appointment event, notification, and audit history.
6. Explain JWT ownership enforcement and a representative test.
7. Show deployment configuration, explicitly distinguishing local execution from cloud deployment.

Use this as a personal portfolio project. Do not describe synthetic integrations, simulated data, or unexecuted cloud deployment as production work at Mount Sinai, UHC, or another employer.
