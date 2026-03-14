// AMap Types Declaration
declare global {
  namespace AMap {
    class Map {
      constructor(container: string | HTMLElement, options?: MapOptions);
      setCenter(center: [number, number]): void;
      setZoom(zoom: number): void;
      addControl(control: any): void;
      on(event: string, callback: (e: MapsEvent) => void): void;
      destroy(): void;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setPosition(position: [number, number]): void;
      setMap(map: Map | null): void;
      on(event: string, callback: (e: MapsEvent) => void): void;
    }

    class Pixel {
      constructor(x: number, y: number);
    }

    class Scale {
      constructor();
    }

    class ToolBar {
      constructor(options?: { position?: string });
    }

    class Geocoder {
      constructor(options?: { radius?: number; extensions?: string });
      getAddress(
        location: [number, number],
        callback: (status: string, result: { regeocode: { formattedAddress: string } }) => void
      ): void;
      getLocation(
        address: string,
        callback: (status: string, result: { geocodes: Array<{ location: { lng: number; lat: number }; address: string }> }) => void
      ): void;
    }

    interface MapOptions {
      zoom?: number;
      center?: [number, number];
    }

    interface MarkerOptions {
      position?: [number, number];
      content?: string;
      offset?: Pixel;
      zIndex?: number;
      draggable?: boolean;
    }

    interface MapsEvent {
      lnglat: {
        lng: number;
        lat: number;
      };
    }

    function plugin(plugins: string[], callback: () => void): void;
  }
}

export {};
