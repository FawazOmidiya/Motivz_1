import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TutorialContextType {
  isTutorialActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  navigateToStep: (step: number) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};

interface TutorialProviderProps {
  children: React.ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({
  children,
}) => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = 6; // Total number of tutorial steps

  const startTutorial = () => {
    console.log(
      "🎯 TutorialContext: startTutorial called, isTutorialActive:",
      isTutorialActive
    );
    if (isTutorialActive) {
      console.log(
        "🎯 TutorialContext: Tutorial already active, ignoring startTutorial call"
      );
      return;
    }
    setIsTutorialActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    console.log(
      "🎯 TutorialContext: nextStep called, currentStep:",
      currentStep,
      "totalSteps:",
      totalSteps
    );
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      console.log("🎯 TutorialContext: Moving to step:", currentStep + 1);
    } else {
      console.log("🎯 TutorialContext: Completing tutorial");
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = async () => {
    try {
      await AsyncStorage.setItem("tutorial_completed", "true");
      setIsTutorialActive(false);
    } catch (error) {
      console.error("Error saving tutorial completion:", error);
    }
  };

  const completeTutorial = async () => {
    console.log("🎯 TutorialContext: completeTutorial called");
    try {
      await AsyncStorage.setItem("tutorial_completed", "true");
      setIsTutorialActive(false);
      console.log("🎯 TutorialContext: Tutorial completed and saved");
    } catch (error) {
      console.error("Error completing tutorial:", error);
    }
  };

  const navigateToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };

  const value: TutorialContextType = {
    isTutorialActive,
    currentStep,
    totalSteps,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    navigateToStep,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export default TutorialProvider;
