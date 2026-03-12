import * as csstree from "css-tree";

/**
 * Result of sanitizing user-submitted CSS.
 */
export interface SanitizeResult {
  /** The sanitized CSS string with dangerous constructs removed */
  sanitized: string;
  /** Human-readable warnings about what was stripped */
  warnings: string[];
}

/** Properties that are known vectors for code injection */
const DANGEROUS_PROPERTIES = new Set(["-moz-binding", "behavior"]);

/**
 * Sanitize user-submitted CSS by stripping dangerous constructs.
 *
 * SECURITY: This is the primary defense against CSS-based attacks.
 * It removes:
 * - @import rules (external stylesheet loading)
 * - @font-face rules (external font loading)
 * - url() functions (data exfiltration via background-image, etc.)
 * - expression() functions (IE legacy code execution)
 * - -moz-binding property (Firefox XBL injection)
 * - behavior property (IE HTC injection)
 */
export function sanitizeCSS(rawCSS: string): SanitizeResult {
  const warnings: string[] = [];

  if (!rawCSS || rawCSS.trim() === "") {
    return { sanitized: "", warnings: [] };
  }

  let ast: csstree.CssNode;
  try {
    ast = csstree.parse(rawCSS, {
      parseAtrulePrelude: false,
      parseRulePrelude: true,
      parseValue: true,
      parseCustomProperty: true,
      onParseError: () => {
        // Silently ignore parse errors - we still sanitize what we can
      },
    });
  } catch {
    warnings.push("CSS could not be parsed; returning empty stylesheet");
    return { sanitized: "", warnings };
  }

  // Collect references to nodes and their list positions for removal.
  // We cannot remove during walk, so we collect and remove in a second pass.
  const toRemove: Array<{
    item: csstree.ListItem<csstree.CssNode>;
    list: csstree.List<csstree.CssNode>;
  }> = [];

  csstree.walk(ast, {
    enter(
      node: csstree.CssNode,
      item: csstree.ListItem<csstree.CssNode>,
      list: csstree.List<csstree.CssNode>,
    ) {
      // Strip @import rules
      if (node.type === "Atrule" && node.name === "import") {
        warnings.push("Stripped @import rule (external stylesheet loading is not allowed)");
        if (list && item) {
          toRemove.push({ item, list });
        }
        return;
      }

      // Strip @font-face rules
      if (node.type === "Atrule" && node.name === "font-face") {
        warnings.push("Stripped @font-face rule (external font loading is not allowed)");
        if (list && item) {
          toRemove.push({ item, list });
        }
        return;
      }

      // Strip url() functions - remove the parent declaration for safety
      if (node.type === "Url") {
        warnings.push("Stripped url() function (external resource loading is not allowed)");
        if (list && item) {
          toRemove.push({ item, list });
        }
        return;
      }

      // Strip expression() functions (IE legacy)
      if (node.type === "Function" && node.name.toLowerCase() === "expression") {
        warnings.push("Stripped expression() function (code execution is not allowed)");
        if (list && item) {
          toRemove.push({ item, list });
        }
        return;
      }

      // Strip dangerous properties: -moz-binding, behavior
      if (node.type === "Declaration") {
        const prop = node.property.toLowerCase();
        if (DANGEROUS_PROPERTIES.has(prop)) {
          warnings.push(`Stripped '${prop}' property (known injection vector)`);
          if (list && item) {
            toRemove.push({ item, list });
          }
        }
      }
    },
  });

  // Remove collected nodes (safe to do after walk completes)
  for (const { item, list } of toRemove) {
    list.remove(item);
  }

  // Generate CSS from the sanitized AST
  let output = csstree.generate(ast);

  // Defense in depth: regex strip any remaining url(...) patterns
  // This catches edge cases where malformed CSS survives AST-based removal
  const urlPattern = /url\s*\([^)]*\)/gi;
  if (urlPattern.test(output)) {
    warnings.push("Stripped residual url() pattern detected in generated output");
    output = output.replace(/url\s*\([^)]*\)/gi, "/* [url removed] */");
  }

  // Defense in depth: strip expression(...)
  const expressionPattern = /expression\s*\([^)]*\)/gi;
  if (expressionPattern.test(output)) {
    warnings.push("Stripped residual expression() pattern detected in generated output");
    output = output.replace(/expression\s*\([^)]*\)/gi, "/* [expression removed] */");
  }

  return { sanitized: output, warnings };
}
