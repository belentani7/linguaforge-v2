import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={() => <Home />} />
      <Route
        path={"/languages"}
        component={() => <Home initialSection="languages" />}
      />
      <Route
        path={"/profile"}
        component={() => <Home initialSection="profile" />}
      />
      <Route
        path={"/practice"}
        component={() => <Home initialSection="practice" />}
      />
      <Route
        path={"/review"}
        component={() => <Home initialSection="review" initialTarget="en" />}
      />
      <Route
        path={"/lesson"}
        component={() => <Home initialSection="lesson" initialTarget="en" />}
      />
      <Route
        path={"/exercise"}
        component={() => <Home initialSection="exercise" initialTarget="en" />}
      />
      <Route
        path={"/qa/pt-en"}
        component={() => (
          <Home
            initialSection="dashboard"
            initialNative="pt"
            initialTarget="en"
          />
        )}
      />
      <Route
        path={"/review-session"}
        component={() => (
          <Home initialSection="review-session" initialTarget="en" />
        )}
      />
      <Route
        path={"/qa-dark/dashboard"}
        component={() => (
          <Home initialSection="dashboard" initialDark initialTarget="en" />
        )}
      />
      <Route
        path={"/qa-dark/languages"}
        component={() => (
          <Home initialSection="languages" initialDark initialTarget="en" />
        )}
      />
      <Route
        path={"/qa-dark/profile"}
        component={() => (
          <Home initialSection="profile" initialDark initialTarget="en" />
        )}
      />
      <Route
        path={"/qa-dark/practice"}
        component={() => (
          <Home initialSection="practice" initialDark initialTarget="en" />
        )}
      />
      <Route
        path={"/qa-dark/review"}
        component={() => (
          <Home initialSection="review" initialDark initialTarget="en" />
        )}
      />
      <Route
        path={"/qa-dark/lesson"}
        component={() => (
          <Home initialSection="lesson" initialDark initialTarget="en" />
        )}
      />
      <Route
        path={"/qa-dark/exercise"}
        component={() => (
          <Home initialSection="exercise" initialDark initialTarget="en" />
        )}
      />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
