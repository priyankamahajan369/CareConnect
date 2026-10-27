# REST API guide

Base URL: `http://localhost:8080/api/v1`. API version is expressed in the path. Errors use RFC-style ProblemDetail with a `detail` field for validation, not-found, and conflict responses. Authentication failures remain 401/403.

| Method | Endpoint | UI / consumer | Access |
|---|---|---|---|
| GET | /patients?q=&page=0&size=20 | Patient directory / patient selectors | STAFF, ADMIN |
| POST | /patients | Add-patient form | STAFF, ADMIN |
| GET | /patients/me | Patient portal booking selector | Authenticated owner |
| GET | /patients/{id} | Appointment Service REST client | Owner or staff/admin |
| GET | /patients/{id}/contacts | Patient detail dialog | Owner or staff/admin |
| GET | /appointments?q=&status=&page=0&size=20 | Schedule, dashboard, patient portal | Owned records, or staff/admin |
| POST | /appointments | Booking dialog | Patient ownership enforced by Patient Service, or staff/admin |
| PATCH | /appointments/{id}/status | Schedule / patient cancellation | Owner may cancel; staff/admin may cancel or complete |
| GET | /providers?state=NY&name= | Provider directory / booking selector | Authenticated |
| POST | /verifications | Eligibility form | STAFF, ADMIN |
| GET | /verifications | Verification history | STAFF, ADMIN |
| GET | /notifications | Activity / patient portal | Owned records, or staff/admin |
| GET | /audit | Appointment audit timeline | STAFF, ADMIN |

Patient registration needs `name`, `email`, `dateOfBirth` (YYYY-MM-DD), `phone`, `insurance`, `memberId`, `ownerSub` (the Keycloak subject, not username). The seeded Maya record is linked to the imported `patient-demo` user. New patient ownership must match a user created in Keycloak. The app does not automatically create identity-provider accounts.

Booking example:

```json
{
  "patientId": "11111111-1111-4111-8111-111111111111",
  "providerId": "demo-rivera",
  "providerName": "Dr. Elena Rivera",
  "specialty": "Family Medicine",
  "startsAt": "2099-01-01T10:00:00Z",
  "visitType": "In person"
}
```

Include a bearer token and `Idempotency-Key: interview-booking-001`. Repeating that exact request returns the same booking. A new key for the same confirmed slot gives 409. Change status with `{"status":"CANCELLED"}`. Completing a future visit is rejected.

Providers are directory entries, not a provider scheduling system. Provider IDs and display names are supplied from the directory selection; the backend does not currently independently verify provider credentials or availability. Validation of a production provider master is a further requirement.

## Postman authentication

Import `postman-api/RestCareConnect.postman_collection.json`. Set `baseUrl` to the gateway and use an OAuth2 Authorization Code with PKCE token:

- Auth URL: `http://localhost:8180/realms/careconnect/protocol/openid-connect/auth`
- Access token URL: `http://localhost:8180/realms/careconnect/protocol/openid-connect/token`
- Client ID: `careconnect-ui`
- PKCE: SHA-256
- Scope: `openid profile email`

For Postman's hosted callback, add its exact callback URL to this client's redirect URIs and web origins in your **local** Keycloak admin UI. Do not enable a wildcard public redirect. Alternatively obtain a token from your signed-in browser's authorized request in DevTools and paste it into the collection's `accessToken` variable for a short local test. Tokens expire; never commit them.

For load tests: `ACCESS_TOKEN=... k6 run k6-performance/k6-appointments.js`. This scenario exercises reads only; the included threshold is a target, not a reported benchmark.

Swagger is available directly on localhost ports 8081–8084. All service-specific schemas are generated from the actual Java endpoints. Metrics are at `/actuator/prometheus` on those internal service ports.
