import Auth0 from "react-native-auth0";

const auth0 = new Auth0({
  domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN as string,
  clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID as string,
});

export default auth0;
