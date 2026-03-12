import { useState, useCallback } from "react";
import { Route, Switch, useLocation } from "wouter";
import { CRTOverlay, useCRTMode } from "@css-mountain/shared-ui";
import { BootSequence } from "./screens/menu/BootSequence";
import { MainMenu } from "./screens/menu/MainMenu";
import { NarrativeIntro } from "./screens/onboarding/NarrativeIntro";
import { TutorialChallenge } from "./screens/onboarding/TutorialChallenge";
import { MapScreen } from "./screens/map/MapScreen";
import { SettingsScreen } from "./screens/settings/SettingsScreen";
import { ComponentDemo } from "./pages/ComponentDemo";

const ONBOARDING_KEY = "css-mountain-onboarding-complete";

/**
 * Root route handler.
 * Shows boot sequence, then either onboarding flow or main menu.
 */
function HomeRoute() {
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
      return <MainMenu onNavigate={handleMenuNavigate} />;
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

function ChallengeRoute({ id }: { id: string }) {
  const [, navigate] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        color: "var(--dos-accent)",
      }}
    >
      <h1>Challenge: {id}</h1>
      <p style={{ color: "var(--dos-fg)", marginTop: "1rem" }}>
        Challenge screen coming in a future epic.
      </p>
      <button
        onClick={() => navigate("/map")}
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
        Back to Map
      </button>
    </div>
  );
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

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/map" component={MapRoute} />
        <Route path="/challenge/:id">
          {(params) => <ChallengeRoute id={params.id} />}
        </Route>
        <Route path="/settings" component={SettingsRoute} />
        <Route path="/achievements" component={AchievementsRoute} />
        <Route path="/dev/components" component={ComponentDemo} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function markOnboardingComplete(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // localStorage unavailable
  }
}
