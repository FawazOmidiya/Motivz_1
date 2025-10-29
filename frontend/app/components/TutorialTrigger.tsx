import React, { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTutorial } from "../contexts/TutorialContext";

interface TutorialTriggerProps {
  children: React.ReactNode;
}

export default function TutorialTrigger({ children }: TutorialTriggerProps) {
  const { startTutorial, isTutorialActive } = useTutorial();

  useEffect(() => {
    const checkAndStartTutorial = async () => {
      try {
        // Don't start tutorial if it's already active
        if (isTutorialActive) {
          return;
        }

        // Check if user just completed profile
        const profileJustCompleted = await AsyncStorage.getItem(
          "profile_just_completed"
        );

        if (profileJustCompleted === "true") {
          // Clear the flag
          await AsyncStorage.removeItem("profile_just_completed");

          // Start tutorial immediately for new users
          setTimeout(() => {
            startTutorial();
          }, 1000);
        } else {
          // Check if tutorial has been completed before (for existing users)
          const hasCompletedTutorial = await AsyncStorage.getItem(
            "tutorial_completed"
          );

          // If tutorial hasn't been completed, start it automatically
          if (!hasCompletedTutorial) {
            // Small delay to let the app load
            setTimeout(() => {
              startTutorial();
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Error checking tutorial status:", error);
      }
    };

    checkAndStartTutorial();
  }, [startTutorial, isTutorialActive]);

  return <>{children}</>;
}
