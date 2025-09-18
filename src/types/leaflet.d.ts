declare module 'leaflet' {
  export = L;
  export as namespace L;

  namespace L {
    interface Icon {
      prototype: any;
      Default: {
        mergeOptions(options: any): void;
        prototype: any;
      };
    }

    interface Util {
      htmlEscape(str: string): string;
    }

    function map(element: string | HTMLElement, options?: any): any;
    function tileLayer(urlTemplate: string, options?: any): any;
    function icon(options: any): any;
    function marker(latlng: any, options?: any): any;
    function latLngBounds(southWest: any, northEast: any): any;

    const Icon: Icon;
    const Util: Util;
  }
}