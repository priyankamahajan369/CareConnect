# CareConnect · Care, beautifully connected.

A downloadable Java / React portfolio project for learning healthcare workflow engineering. Release **1.0.0 · frozen scope**. Uses synthetic records; it is not clinical software or a verified insurance system.

## Start here

**Fastest visual demo:** open `html-careconnect-demo.html` in a desktop browser after extracting the ZIP. No installation is needed. It contains the compiled React app. All data stays in that browser; no Java service or cloud account is used in this mode. Internet access is optional for the web fonts. If your browser blocks local file storage, use the Node demo below.

**Frontend development demo:** install Node.js 22.12+ LTS, then:

```bash
cd react-careconnect-ui
npm ci
npm run dev
```

Open http://localhost:5173. Default mode is the synthetic browser demo. Navigation uses hash URLs, e.g. `/#/appointments`. Changes persist in localStorage; reset through Workspace settings.

**Full Java microservices:** install Docker Desktop with Compose v2 and allow at least 10–12 GB RAM. From the extracted CareConnect root:

```bash
cp .env.example .env
docker compose up --build -d
```

Windows PowerShell: `Copy-Item .env.example .env`, then the same Docker command. Initial builds download Maven, npm, and container dependencies and can take several minutes. Check `docker compose ps` and `docker compose logs -f appointment`.

Open http://localhost:5173. Compose builds the UI in **live mode** and redirects to local Keycloak. Use:

| Account | Username | Password | Permissions |
|---|---|---|---|
| Coordinator | staff | CareConnect-Staff-2026! | Patient management, bookings, verification, audit |
| Patient | patient | CareConnect-Patient-2026! | Own patient record, own bookings/cancellations, own notifications |

These are intentionally local demo accounts. Do not expose this Compose configuration publicly. Keycloak admin: http://localhost:8180 (`admin`, password from `.env`). Grafana: http://localhost:3000 (`admin`, GRAFANA_PASSWORD from `.env`). Prometheus: http://localhost:9090.

To stop: `docker compose down`. Existing data survives. `docker compose down -v` deliberately erases local databases and resets imported realm data.

## What you can demonstrate

1. Explore the care dashboard and provider directory.
2. Register a synthetic patient or use Maya Bennett.
3. Book a **future** appointment on a 30-minute local time boundary. The app stores UTC instants.
4. Attempt a second booking for the same provider or patient in that slot; the database rejects it.
5. Cancel the booking and observe the schedule, audit trail, and notification update. Mark a past confirmed visit complete.
6. Run a simulated insurance check. `INACTIVE` at the beginning of a member ID produces an inactive synthetic response.
7. In the full stack, inspect the outbox → Kafka → notification workflow and Grafana traces.
8. Sign in as a patient and verify that other patients' records cannot be read or changed.

Demo mode starts with example appointments. Java services start with four patients and three fictional providers, but no appointments: create your own future booking. These are deliberately separate databases, not synchronized modes.

## Repository map

| Folder | Responsibility |
|---|---|
| `react-careconnect-ui` | React + TypeScript, Redux Toolkit / RTK Query, Material UI, CSS, forms, routed screens |
| `springboot-common` | JWT validation, roles, correlation IDs, consistent API problem responses |
| `springboot-patient-service` | Patients and patient contacts; Hibernate one-to-many / many-to-one mapping |
| `springboot-appointment-service` | Slot guard, idempotency, status transitions, audit, transactional outbox, REST patient client |
| `springboot-insurance-service` | CMS NPPES provider adapter, Redis directory cache, Resilience4j, simulated eligibility |
| `springboot-notification-service` | Kafka deduplication, retries / DLT, durable notification inbox, Resend email adapter |
| `springcloud-api-gateway` | Spring Cloud Gateway routes all UI API calls to owning services |
| `keycloak-security` | Local OIDC realm, PKCE client, test accounts, audience mapper |
| `postgres-databases` | Independent service database initialization |
| `terraform-aws` | VPC, ECS, ECR, RDS, Redis, MSK, S3, CloudFront, Route 53, ALB, IAM, secrets, logs |
| `.github/workflows` | Quality gates, image publication, explicit AWS deployment |
| `prometheus-monitoring`, `grafana-monitoring`, `opentelemetry-monitoring` | Local metrics, dashboard, trace collection and storage |
| `postman-api` | Importable API collection |
| `k6-performance` | Authenticated appointment read load scenario |
| `documentation-project` | Scope, architecture, API guide, AWS runbook, seven-day learning route, verification record |

Skill prefixes identify custom files and folders. Mandatory conventions remain `pom.xml`, `application.yml`, `package.json`, `Dockerfile`, `compose.yml`, migration filenames, and framework configuration names. Java package segments stay lowercase.

## Development checks

With JDK 21 and Maven 3.9+:

```bash
mvn verify
```

This compiles all services and runs JUnit / Mockito, WireMock, API security tests, and the PostgreSQL Testcontainers test. The container test is skipped when Docker is unavailable; review test output rather than treating a skip as a pass. To build one service plus its dependencies: `mvn -pl springboot-appointment-service -am package`.

Frontend:

```bash
cd react-careconnect-ui
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

For local live frontend development outside Compose, use `VITE_MODE=live npm run dev` (PowerShell: `$env:VITE_MODE='live'; npm run dev`) while gateway and Keycloak run. Only the browser demo uses localStorage for app data. Live OIDC uses Authorization Code + PKCE; bearer tokens stay in Keycloak's in-memory adapter.

Swagger: http://localhost:8081/swagger-ui/index.html (Patient), 8082 (Appointment), 8083 (Insurance), 8084 (Notification). Use Authorize with an access token obtained through the OIDC client. The gateway API base is http://localhost:8080/api/v1. Postman setup is in `documentation-project/RestApiGuide.md`.

## Third-party integrations

- **CMS NPPES API v2.1:** the backend calls the public provider registry. Set `INTEGRATION_MODE=live` and restart the insurance service. No key is required. A blank live search defaults to last name Smith because CMS requires more than a state; the returned source labels that default. The UI displays the returned source. Registry data is not appointment availability or insurance participation.
- **Resend:** the notification service calls `POST /emails`. Live delivery requires `EMAIL_API_KEY` and a verified `EMAIL_FROM`. Use only an address you own for a live delivery test. Stable event IDs are sent as provider idempotency keys.
- **Insurance:** always simulated, even in live integration mode. No real payer agreement or eligibility API is supplied. Responses explicitly say SIMULATED. Real payer integration would require authorization and a separate adapter.

The adapters are implemented but live external delivery and cloud deployment require your account setup. See the verification record for what was actually executed in this build environment.

## Version and deployment notes

Java 21; Spring Boot 3.5.7; Spring Cloud 2025.0.0; PostgreSQL 17; React 19; TypeScript 5.9. Versions are pinned for reproducibility, not presented as the newest supported production stack. npm lockfile and Terraform provider lockfile are included. Review security scan findings and support lifecycles before public deployment.

No infrastructure is created by opening the ZIP. AWS resources such as MSK, RDS, NAT Gateway, and ALB incur ongoing charges; use the AWS runbook before deployment. This release is a portfolio learning system, not a claim of HIPAA certification, production operation, real insurance coverage, or work performed at a named employer.

Cheat sheets are intentionally deferred, as requested.
