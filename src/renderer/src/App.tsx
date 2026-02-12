import React, { useState } from "react";
import { BillingMethodPage } from "./features/onboarding/billing-method-page";
import { AnthropicOnboardingPage } from "./features/onboarding/anthropic-onboarding-page";
import { ApiKeyOnboardingPage } from "./features/onboarding/api-key-onboarding-page";
import { SelectDirectoryPage } from "./features/onboarding/select-directory-page";
import { ChatPage } from "./features/chat";
import { Toaster } from "sonner";

// Set to true to show the chat demo page
const SHOW_DEMO = true;

type OnboardingStep = "billing" | "anthropic-auth" | "api-key" | "select-directory" | "done";

const App = () => {
  const [step, setStep] = useState<OnboardingStep>("billing");

  if (SHOW_DEMO) {
    return <ChatPage />;
  }

  return (
    <>
      <Toaster richColors />
      {step === "billing" && (
        <BillingMethodPage
          onContinue={(method) => {
            if (method === "claude-subscription") {
              setStep("anthropic-auth");
            } else {
              setStep("api-key");
            }
          }}
        />
      )}

      {step === "anthropic-auth" && (
        <AnthropicOnboardingPage
          onBack={() => setStep("billing")}
          onComplete={() => setStep("select-directory")}
        />
      )}

      {step === "api-key" && (
        <ApiKeyOnboardingPage
          onBack={() => setStep("billing")}
          onComplete={() => setStep("select-directory")}
        />
      )}

      {step === "select-directory" && (
        <SelectDirectoryPage
          onComplete={(dir) => {
            console.log("Selected directory:", dir);
            setStep("done");
          }}
        />
      )}

      {step === "done" && (
        <div className="h-dvh flex flex-col bg-background text-foreground">
          <div
            className="shrink-0 h-10"
            style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
          />
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-2xl font-semibold">You're all set!</h1>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
