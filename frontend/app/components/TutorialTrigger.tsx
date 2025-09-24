import React, { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTutorial } from "../contexts/TutorialContext";

interface TutorialTriggerProps {
  children: React.ReactNode;
}

export default function TutorialTrigger({ children }: TutorialTriggerProps) {
  const { startTutorial, isTutorialActive } = useTutorial();

  console.log(
    "🔍 TutorialTrigger: Rendering, isTutorialActive:",
    isTutorialActive
  );

  useEffect(() => {
    const checkAndStartTutorial = async () => {
      try {
        console.log("🔍 TutorialTrigger: checkAndStartTutorial called");

        // Don't start tutorial if it's already active
        if (isTutorialActive) {
          console.log("🔍 TutorialTrigger: Tutorial already active, skipping");
          return;
        }

        // Check if user just completed profile
        const profileJustCompleted = await AsyncStorage.getItem(
          "profile_just_completed"
        );
        console.log(
          "🔍 TutorialTrigger: profileJustCompleted =",
          profileJustCompleted
        );

        if (profileJustCompleted === "true") {
          console.log("🚀 Starting tutorial for new user");
          // Clear the flag
          await AsyncStorage.removeItem("profile_just_completed");

          // Start tutorial immediately for new users
          setTimeout(() => {
            console.log("📚 Starting tutorial now");
            startTutorial();
          }, 1000);
        } else {
          // Check if tutorial has been completed before (for existing users)
          const hasCompletedTutorial = await AsyncStorage.getItem(
            "tutorial_completed"
          );
          console.log(
            "🔍 TutorialTrigger: hasCompletedTutorial =",
            hasCompletedTutorial
          );

          // If tutorial hasn't been completed, start it automatically
          if (!hasCompletedTutorial) {
            console.log("🚀 Starting tutorial for existing user");
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
