import { Route, Switch } from "wouter";

function Home() {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        backgroundColor: "#000",
        color: "#33ff33",
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <pre>{`
   _____ _____ _____   __  __                  _        _
  / ____/ ____/ ____| |  \\/  |                | |      (_)
 | |   | (___| (___   | \\  / | ___  _   _ _ __ | |_ __ _ _ _ __
 | |    \\___ \\\\\\___ \\  | |\\/| |/ _ \\| | | | '_ \\| __/ _\` | | '_ \\
 | |____| ___) |___) | | |  | | (_) | |_| | | | | || (_| | | | | |
  \\_____|____/|____/  |_|  |_|\\___/ \\__,_|_| |_|\\__\\__,_|_|_| |_|
      `}</pre>
      <p>Learn CSS by climbing the mountain. One challenge at a time.</p>
      <p style={{ color: "#aaa", marginTop: "1rem" }}>
        C:\\CSS_MOUNTAIN&gt; <span style={{ color: "#33ff33" }}>_</span>
      </p>
    </div>
  );
}

function NotFound() {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        backgroundColor: "#000",
        color: "#ff3333",
        minHeight: "100vh",
        padding: "2rem",
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
      <Route component={NotFound} />
    </Switch>
  );
}
