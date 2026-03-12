import { Route, Switch } from "wouter";
import { ComponentDemo } from "./pages/ComponentDemo";

function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <pre
        style={{ color: "var(--dos-accent)" }}
      >{`
   _____ _____ _____   __  __                  _        _
  / ____/ ____/ ____| |  \\/  |                | |      (_)
 | |   | (___| (___   | \\  / | ___  _   _ _ __ | |_ __ _ _ _ __
 | |    \\___ \\\\___ \\  | |\\/| |/ _ \\| | | | '_ \\| __/ _\` | | '_ \\
 | |____| ___) |___) | | |  | | (_) | |_| | | | | || (_| | | | | |
  \\_____|____/|____/  |_|  |_|\\___/ \\__,_|_| |_|\\__\\__,_|_|_| |_|
      `}</pre>
      <p>Learn CSS by climbing the mountain. One challenge at a time.</p>
      <p style={{ marginTop: "1rem" }}>
        {"C:\\CSS_MOUNTAIN> "}
        <span style={{ color: "var(--dos-accent)" }}>_</span>
      </p>
    </div>
  );
}

function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        color: "var(--dos-error)",
      }}
    >
      <h1>404 - PATH NOT FOUND</h1>
      <p>The requested route does not exist on this mountain.</p>
    </div>
  );
}

export function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dev/components" component={ComponentDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}
