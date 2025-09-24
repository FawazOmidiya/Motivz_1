import React from "react";
import { useTutorial } from "../contexts/TutorialContext";
import TutorialNavigator from "../navigation/TutorialNavigator";

interface TutorialWrapperProps {
  children: React.ReactNode;
}

export default function TutorialWrapper({ children }: TutorialWrapperProps) {
  const { isTutorialActive } = useTutorial();

  if (isTutorialActive) {
    return <TutorialNavigator />;
  }

  return <>{children}</>;
}
