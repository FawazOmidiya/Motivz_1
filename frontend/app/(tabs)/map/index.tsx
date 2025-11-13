// Map tab route - renders the existing MapScreen
import { Platform } from "react-native";

let MapScreen: any;
if (Platform.OS === "web") {
  MapScreen = require("../../screens/MapScreen.web").default;
} else {
  MapScreen = require("../../screens/MapScreen").default;
}

export default MapScreen;
