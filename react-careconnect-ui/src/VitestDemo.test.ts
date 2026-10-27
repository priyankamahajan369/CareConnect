import { beforeEach, describe, it, expect } from "vitest";
import { demoRequest } from "./ReduxDemoDatabase";
beforeEach(() => localStorage.clear());
describe("booking workflow", () => {
  it("rejects a conflicting provider slot and frees it after cancellation", async () => {
    const day = new Date();
    day.setDate(day.getDate() + 10);
    day.setHours(12, 0, 0, 0);
    const body = {
      patientId: "11111111-1111-4111-8111-111111111111",
      providerId: "demo-rivera",
      providerName: "Dr. Elena Rivera",
      specialty: "Family Medicine",
      startsAt: day.toISOString(),
      visitType: "In person",
    };
    const a = (await demoRequest("/api/v1/appointments", "POST", body)) as {
      id: string;
    };
    await expect(
      demoRequest("/api/v1/appointments", "POST", body),
    ).rejects.toThrow("already has");
    await demoRequest("/api/v1/appointments/" + a.id + "/status", "PATCH", {
      status: "CANCELLED",
    });
    await expect(
      demoRequest("/api/v1/appointments", "POST", body),
    ).resolves.toHaveProperty("status", "CONFIRMED");
  });
  it("never labels synthetic eligibility as actual coverage", async () => {
    const r = (await demoRequest("/api/v1/verifications", "POST", {
      patientId: "x",
      memberId: "INACTIVE01",
      payer: "Synthetic",
    })) as { source: string; status: string };
    expect(r.status).toBe("INACTIVE");
    expect(r.source).toContain("SIMULATED");
  });
  it("rejects duplicate patient identifiers", async () => {
    await expect(
      demoRequest("/api/v1/patients", "POST", {
        email: "maya@example.test",
        memberId: "new",
      }),
    ).rejects.toThrow("already exists");
  });
});
