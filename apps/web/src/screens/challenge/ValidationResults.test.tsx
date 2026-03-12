import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ValidationResults } from "./ValidationResults";

const MOCK_RULE = {
  type: "computed-style" as const,
  selector: ".box",
  property: "display",
  expected: "flex",
  weight: 1,
  message: "Box should use flexbox",
};

describe("ValidationResults", () => {
  it("renders nothing when ruleResults is empty", () => {
    const { container } = render(
      <ValidationResults ruleResults={[]} allPassed={true} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows ALL CHECKS PASSED when all pass", () => {
    render(
      <ValidationResults
        ruleResults={[
          { rule: MOCK_RULE, passed: true, message: "Display is flex" },
        ]}
        allPassed={true}
      />,
    );
    expect(screen.getByText("ALL CHECKS PASSED")).toBeInTheDocument();
    expect(screen.getByText("1/1")).toBeInTheDocument();
  });

  it("shows VALIDATION RESULTS when not all pass", () => {
    render(
      <ValidationResults
        ruleResults={[
          { rule: MOCK_RULE, passed: true, message: "Display is flex" },
          { rule: { ...MOCK_RULE, property: "color" }, passed: false, message: "Color is wrong" },
        ]}
        allPassed={false}
      />,
    );
    expect(screen.getByText("VALIDATION RESULTS")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("renders each rule result with pass/fail indicator", () => {
    render(
      <ValidationResults
        ruleResults={[
          { rule: MOCK_RULE, passed: true, message: "Display is flex" },
          { rule: { ...MOCK_RULE, property: "color" }, passed: false, message: "Color is wrong" },
        ]}
        allPassed={false}
      />,
    );
    expect(screen.getByText("Display is flex")).toBeInTheDocument();
    expect(screen.getByText("Color is wrong")).toBeInTheDocument();
  });

  it("has accessible list structure", () => {
    render(
      <ValidationResults
        ruleResults={[
          { rule: MOCK_RULE, passed: true, message: "Display is flex" },
        ]}
        allPassed={true}
      />,
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toBeInTheDocument();
  });
});
