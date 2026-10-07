import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ErrorNote, Field } from "./UI";
describe("Accessible errors and fields", () => {
  it("announces server validation details without interpreting untrusted HTML", () => {
    const html = renderToStaticMarkup(
      <ErrorNote
        error={{
          message: "Check values",
          fields: { grams: "<script>unsafe()</script>" },
        }}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("grams:");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
  it("keeps the input within its visible label", () => {
    const html = renderToStaticMarkup(
      <Field label="Weight (kg)">
        <input name="weight" />
      </Field>,
    );
    expect(html).toMatch(
      /<label[^>]*><span>Weight \(kg\)<\/span><input[^>]*\/><\/label>/,
    );
  });
  it("does not leave an alert when there is no error", () =>
    expect(renderToStaticMarkup(<ErrorNote error={null} />)).toBe(""));
});
