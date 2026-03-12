/**
 * A sandboxed iframe for rendering CSS challenge previews.
 *
 * SECURITY: The iframe uses `sandbox="allow-scripts"` (NO allow-same-origin),
 * which means the parent cannot directly access iframe.contentDocument.
 * Instead, a postMessage bridge is injected into the srcdoc to relay
 * computed style and bounding rect queries.
 */

/** Timeout for postMessage responses (ms) */
const MESSAGE_TIMEOUT = 3000;

/** Counter for unique message IDs */
let messageIdCounter = 0;

/**
 * Script injected into the iframe srcdoc to handle postMessage queries
 * from the parent frame. Responds with computed style and bounding rect data.
 */
const BRIDGE_SCRIPT = `
<script>
window.addEventListener('message', function(e) {
  var data = e.data;
  if (!data || !data.type) return;

  if (data.type === 'getComputedStyle') {
    var el = document.querySelector(data.selector);
    if (el) {
      var style = window.getComputedStyle(el);
      e.source.postMessage({
        type: 'computedStyleResult',
        id: data.id,
        value: style.getPropertyValue(data.property)
      }, '*');
    } else {
      e.source.postMessage({
        type: 'computedStyleResult',
        id: data.id,
        value: null,
        error: 'Element not found: ' + data.selector
      }, '*');
    }
  }

  if (data.type === 'getBoundingRect') {
    var el2 = document.querySelector(data.selector);
    if (el2) {
      var rect = el2.getBoundingClientRect();
      e.source.postMessage({
        type: 'boundingRectResult',
        id: data.id,
        value: { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right }
      }, '*');
    } else {
      e.source.postMessage({
        type: 'boundingRectResult',
        id: data.id,
        value: null,
        error: 'Element not found: ' + data.selector
      }, '*');
    }
  }
});
<` + `/script>
`;

/** Content Security Policy meta tag for the srcdoc */
const CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'">`;

interface PendingMessage {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Manages a sandboxed iframe for CSS preview rendering.
 *
 * Uses postMessage-based communication to query computed styles and
 * bounding rects inside the sandbox, since cross-origin access is
 * blocked by the sandbox attribute.
 */
export class IframeSandbox {
  private iframe: HTMLIFrameElement | null = null;
  private pendingMessages = new Map<string, PendingMessage>();
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  /**
   * Create the sandboxed iframe and attach it to the given container.
   */
  create(container: HTMLElement): HTMLIFrameElement {
    this.destroy();

    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.backgroundColor = "#fff";

    // Set empty srcdoc initially
    iframe.srcdoc = this.buildSrcdoc("", "");

    container.appendChild(iframe);
    this.iframe = iframe;

    // Set up message listener for postMessage bridge responses
    this.messageHandler = (event: MessageEvent) => {
      this.handleMessage(event);
    };
    window.addEventListener("message", this.messageHandler);

    return iframe;
  }

  /**
   * Update the iframe content with new HTML and CSS.
   */
  updateContent(html: string, css: string): void {
    if (!this.iframe) return;
    this.iframe.srcdoc = this.buildSrcdoc(html, css);
  }

  /**
   * Get the iframe's content document.
   * NOTE: This will return null when sandbox does not include allow-same-origin,
   * which is the expected secure configuration. Use postMessage bridge methods instead.
   */
  getDocument(): Document | null {
    if (!this.iframe) return null;
    try {
      return this.iframe.contentDocument;
    } catch {
      // Cross-origin access blocked by sandbox - expected behavior
      return null;
    }
  }

  /**
   * Query a computed style value from an element inside the iframe.
   * Uses the postMessage bridge since direct DOM access is blocked.
   */
  async getComputedStyle(selector: string, property: string): Promise<string | null> {
    if (!this.iframe) return null;

    const id = `cs_${++messageIdCounter}`;
    const result = await this.sendMessage(
      {
        type: "getComputedStyle",
        id,
        selector,
        property,
      },
      id,
      "computedStyleResult",
    );

    if (result && typeof result === "object" && "value" in result) {
      const msg = result as { value: string | null };
      return msg.value;
    }
    return null;
  }

  /**
   * Query the bounding client rect of an element inside the iframe.
   * Uses the postMessage bridge since direct DOM access is blocked.
   */
  async getBoundingRect(
    selector: string,
  ): Promise<{
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
  } | null> {
    if (!this.iframe) return null;

    const id = `br_${++messageIdCounter}`;
    const result = await this.sendMessage(
      {
        type: "getBoundingRect",
        id,
        selector,
      },
      id,
      "boundingRectResult",
    );

    if (result && typeof result === "object" && "value" in result) {
      const msg = result as {
        value: {
          top: number;
          left: number;
          width: number;
          height: number;
          bottom: number;
          right: number;
        } | null;
      };
      return msg.value;
    }
    return null;
  }

  /**
   * Clean up the iframe and all event listeners.
   */
  destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
      this.messageHandler = null;
    }

    // Reject any pending messages
    for (const [, pending] of this.pendingMessages) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Sandbox destroyed"));
    }
    this.pendingMessages.clear();

    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
  }

  /** Build the full srcdoc HTML string with CSP, bridge script, and user content */
  private buildSrcdoc(html: string, css: string): string {
    return `<!DOCTYPE html>
<html>
<head>
${CSP_META}
<style>${css}</style>
</head>
<body>
${html}
${BRIDGE_SCRIPT}
</body>
</html>`;
  }

  /** Send a message to the iframe and wait for a response matching the given ID */
  private sendMessage(
    message: Record<string, unknown>,
    id: string,
    _expectedType: string,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.iframe?.contentWindow) {
        reject(new Error("Iframe not available"));
        return;
      }

      const timer = setTimeout(() => {
        this.pendingMessages.delete(id);
        reject(new Error(`Message timeout for ${id}`));
      }, MESSAGE_TIMEOUT);

      this.pendingMessages.set(id, { resolve, reject, timer });
      this.iframe.contentWindow.postMessage(message, "*");
    });
  }

  /** Handle incoming postMessage responses from the iframe bridge */
  private handleMessage(event: MessageEvent): void {
    const data = event.data;
    if (!data || typeof data !== "object" || !data.id) return;

    const pending = this.pendingMessages.get(data.id);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingMessages.delete(data.id);
      pending.resolve(data);
    }
  }
}
