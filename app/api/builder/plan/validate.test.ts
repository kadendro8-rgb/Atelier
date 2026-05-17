import { describe, expect, it } from "vitest";
import { validatePlanPutBody } from "./validate";

describe("validatePlanPutBody — rejected bodies", () => {
  it("rejects non-object bodies", () => {
    expect(validatePlanPutBody(null)).toBeNull();
    expect(validatePlanPutBody(undefined)).toBeNull();
    expect(validatePlanPutBody("a string")).toBeNull();
    expect(validatePlanPutBody(42)).toBeNull();
  });

  it("rejects a missing or blank projectId", () => {
    expect(validatePlanPutBody({ planGraph: {} })).toBeNull();
    expect(validatePlanPutBody({ projectId: "", planGraph: {} })).toBeNull();
    expect(validatePlanPutBody({ projectId: "   ", planGraph: {} })).toBeNull();
    expect(validatePlanPutBody({ projectId: 123, planGraph: {} })).toBeNull();
  });

  it("rejects a planGraph that is not a plain object", () => {
    expect(validatePlanPutBody({ projectId: "p1" })).toBeNull();
    expect(validatePlanPutBody({ projectId: "p1", planGraph: null })).toBeNull();
    expect(validatePlanPutBody({ projectId: "p1", planGraph: [] })).toBeNull();
    expect(
      validatePlanPutBody({ projectId: "p1", planGraph: "graph" }),
    ).toBeNull();
  });
});

describe("validatePlanPutBody — accepted bodies", () => {
  it("returns the narrowed body for a well-formed request", () => {
    const graph = { schemaVersion: 1, rooms: [] };
    const result = validatePlanPutBody({ projectId: "proj-9", planGraph: graph });
    expect(result).toEqual({ projectId: "proj-9", planGraph: graph });
  });

  it("ignores unrelated extra fields", () => {
    const result = validatePlanPutBody({
      projectId: "p1",
      planGraph: {},
      junk: "ignored",
    });
    expect(result).not.toBeNull();
    expect(result!.projectId).toBe("p1");
  });
});
