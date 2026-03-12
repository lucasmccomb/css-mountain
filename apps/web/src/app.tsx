import { useState, useCallback, useEffect } from "react";
import { Route, Switch, useLocation, useParams } from "wouter";
import { CRTOverlay, useCRTMode } from "@css-mountain/shared-ui";
import { BootSequence } from "./screens/menu/BootSequence";
import { MainMenu } from "./screens/menu/MainMenu";
import { NarrativeIntro } from "./screens/onboarding/NarrativeIntro";
import { TutorialChallenge } from "./screens/onboarding/TutorialChallenge";
import { MapScreen } from "./screens/map/MapScreen";
import { SettingsScreen } from "./screens/settings/SettingsScreen";
import { ComponentDemo } from "./pages/ComponentDemo";
import { ChallengeScreen } from "./screens/challenge/ChallengeScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineFallback } from "./components/OfflineFallback";
import { authClient, type AuthState } from "./services/auth-client";

function ChallengeRoute() {
  const params = useParams<{ id: string }>();
  return <ChallengeScreen challengeId={params.id} />;
}

const ONBOARDING_KEY = "css-mountain-onboarding-complete";

/**
 * Root route handler.
 * Shows boot sequence, then either onboarding flow or main menu.
 */
function HomeRoute({ authState }: { authState: AuthState }) {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<"boot" | "narrative" | "tutorial" | "menu">("boot");

  const onboardingComplete = (() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === "true";
    } catch {
      return false;
    }
  })();

  const handleBootComplete = useCallback(() => {
    if (onboardingComplete) {
      setPhase("menu");
    } else {
      setPhase("narrative");
    }
  }, [onboardingComplete]);

  const handleNarrativeStartTutorial = useCallback(() => {
    setPhase("tutorial");
  }, []);

  const handleNarrativeSkip = useCallback(() => {
    markOnboardingComplete();
    setPhase("menu");
  }, []);

  const handleTutorialComplete = useCallback(() => {
    markOnboardingComplete();
    setPhase("menu");
  }, []);

  const handleTutorialSkip = useCallback(() => {
    markOnboardingComplete();
    setPhase("menu");
  }, []);

  const handleMenuNavigate = useCallback(
    (route: string) => {
      navigate(route);
    },
    [navigate],
  );

  switch (phase) {
    case "boot":
      return <BootSequence onComplete={handleBootComplete} />;
    case "narrative":
      return (
        <NarrativeIntro
          onStartTutorial={handleNarrativeStartTutorial}
          onSkip={handleNarrativeSkip}
        />
      );
    case "tutorial":
      return (
        <TutorialChallenge
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      );
    case "menu":
      return <MainMenu onNavigate={handleMenuNavigate} authState={authState} />;
  }
}

function MapRoute() {
  const [, navigate] = useLocation();

  const handleSelectChallenge = useCallback(
    (challengeId: string) => {
      navigate(`/challenge/${challengeId}`);
    },
    [navigate],
  );

  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return <MapScreen onSelectChallenge={handleSelectChallenge} onBack={handleBack} />;
}

function SettingsRoute() {
  const [, navigate] = useLocation();

  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return <SettingsScreen onBack={handleBack} />;
}

function AchievementsRoute() {
  const [, navigate] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        color: "var(--dos-accent)",
      }}
    >
      <h1>Achievements</h1>
      <p style={{ color: "var(--dos-fg)", marginTop: "1rem" }}>
        Achievements screen coming in a future epic.
      </p>
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "1rem",
          background: "none",
          border: "1px solid var(--dos-accent)",
          color: "var(--dos-accent)",
          padding: "8px 16px",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Back to Menu
      </button>
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
  const { enabled: crtEnabled } = useCRTMode(true);
  const [authState, setAuthState] = useState<AuthState>(() =>
    authClient.getCachedState(),
  );

  // Check auth on mount (and after OAuth redirects)
  useEffect(() => {
    authClient.checkAuth().then(setAuthState);
  }, []);

  return (
    <ErrorBoundary>
      <CRTOverlay enabled={crtEnabled} />
      <OfflineFallback />
      <Switch>
        <Route path="/">
          <HomeRoute authState={authState} />
        </Route>
        <Route path="/map">
          <ErrorBoundary>
            <MapRoute />
          </ErrorBoundary>
        </Route>
        <Route path="/challenge/:id">
          <ErrorBoundary>
            <ChallengeRoute />
          </ErrorBoundary>
        </Route>
        <Route path="/challenge">
          <ErrorBoundary>
            <ChallengeScreen />
          </ErrorBoundary>
        </Route>
        <Route path="/settings">
          <SettingsRoute />
        </Route>
        <Route path="/achievements">
          <AchievementsRoute />
        </Route>
        <Route path="/dev/components" component={ComponentDemo} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function markOnboardingComplete(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // localStorage unavailable
  }
}
