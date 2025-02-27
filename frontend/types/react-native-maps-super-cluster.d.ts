declare module "react-native-maps-super-cluster" {
  import { Component } from "react";
  import MapView, { MapViewProps } from "react-native-maps";
  import { MarkerProps } from "react-native-maps";

  export interface ClusteredMapViewProps extends MapViewProps {
    data: any[];
    renderMarker: (data: any) => JSX.Element;
    renderCluster: (cluster: any, onPress: () => void) => JSX.Element;
  }

  export default class ClusteredMapView extends Component<ClusteredMapViewProps> {}
}
