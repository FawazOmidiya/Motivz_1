import axios from "axios";
import Constants from "expo-constants";

const GOOGLE_MAPS_API_KEY = "AIzaSyCJPh0xQdW7gkD2Zr275Bq8R8hmE758M80";

/**
 * Reverse Geocoding: Converts coordinates into a readable address.
 * @param latitude Latitude of the location.
 * @param longitude Longitude of the location.
 * @returns Formatted address or null.
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === "OK") {
      return response.data.results[0].formatted_address;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return null;
  }
};

/**
 * Forward Geocoding: Converts an address into GPS coordinates.
 * @param address Address to convert.
 * @returns { latitude, longitude } or null.
 */
export const getCoordinatesFromAddress = async (address: string) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === "OK") {
      return response.data.results[0].geometry.location;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in forward geocoding:", error);
    return null;
  }
};
