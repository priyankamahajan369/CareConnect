# Verification record · 2026-10-27

This record distinguishes executed checks from supplied configuration.

| Check | Result |
|---|---|
| JDK 21 / Maven reactor verify | All six modules compile and package successfully |
| Backend tests | 10 passed; 1 PostgreSQL Testcontainers test skipped because Docker is unavailable |
| Frontend TypeScript / Vite build | Passed |
| Vitest + React Testing Library | 4 tests passed |
| Playwright Chromium | 4 tests passed: eligibility, mobile navigation, booking/duplicate rejection/cancellation, patient contacts |
| Portable HTML demo | Opened directly using file:// in Chromium; dashboard and patient navigation loaded without page errors |
| Desktop and mobile visual inspection | Completed using internal browser screenshots; screenshots are not included |
| npm audit | 0 reported vulnerabilities in the frozen frontend dependency tree at check time |
| Java source formatting | google-java-format applied |
| GitHub Actions workflow lint | actionlint passed (shellcheck/pyflakes integrations disabled) |
| XML / YAML source parsing | Passed |
| Terraform formatting / HCL parse | terraform fmt -check passed |
| Terraform provider initialization | Passed; AWS provider lockfile included |
| Terraform full validate | Blocked by provider-plugin handshake restrictions in the build environment; not claimed as passed |
| CMS public API read | A last-name Smith / NY v2.1 read returned results; Java mapping is separately tested with WireMock |
| Full Docker Compose runtime | Not run: Docker is unavailable in this build environment |
| Live Keycloak login through the full stack | Configuration supplied; not runtime-verified here |
| Kafka / Redis / real PostgreSQL end-to-end runtime | Configuration and code supplied; not runtime-verified here |
| Real email delivery / real payer eligibility | Email not sent; eligibility remains explicitly simulated |
| AWS deployment / rollback / restore | Not executed; requires your account, DNS, identity host, permissions and budget |
| Trivy / SonarQube / k6 | Configurations supplied; no passing scan, quality score, or performance benchmark claimed |

The React browser demo simulates HTTP results in RTK Query and persists synthetic data locally. It does not prove that Java, Kafka, databases, or cloud services have run. Maven verifies compilation, packaging and the backend tests listed above. Review the Docker and cloud runbooks before extending that verification.

The pinned backend versions are a reproducible learning baseline, not a claim of current vulnerability-free dependencies. Run and address the included scans before a public deployment.
