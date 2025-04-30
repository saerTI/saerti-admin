// react plugin for creating vector maps
import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";
import { useMemo } from "react";

// Define the component props
interface CountryMapProps {
  mapColor?: string;
}

// Type for marker data
interface ChileMarker {
  latLng: [number, number];
  name: string;
  style: {
    fill: string;
    borderWidth: number;
    borderColor: string;
    r?: number;
  };
}

const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => {
  // Set initial focus on Chile with appropriate zoom level
  const mapOptions = useMemo(() => ({
    zoomOnScroll: true,
    zoomMax: 12,
    zoomMin: 1,
    zoomAnimate: true,
    zoomStep: 1.5,
    // Initial view focused on Chile
    focusOn: {
      x: 0.5, 
      y: 0.7, 
      scale: 5,
      region: 'CL'
    },
    // Only enable Chile for selection
    selectedRegions: ['CL'],
    regionsSelectable: false
  }), []);

  // Define Chile-specific locations
  const chileMarkers = useMemo<ChileMarker[]>(() => [
    {
      latLng: [-24.2692, -69.0714],
      name: "Río Tinto",
      style: {
        fill: "#FF5733",
        borderWidth: 1,
        borderColor: "white",
        r: 5,
      },
    },
    {
      latLng: [-18.4783, -70.3126],
      name: "BHP EXPLORACIONES",
      style: {
        fill: "#465FFF",
        borderWidth: 1,
        borderColor: "white",
        r: 5,
      },
    },
    {
      latLng: [-39.9562, -72.8521],
      name: "Ruta 233 Reumén",
      style: {
        fill: "#33FF57",
        borderWidth: 1,
        borderColor: "white",
        r: 5,
      },
    },
    {
      latLng: [-39.8142, -73.2459],
      name: "Valdivia",
      style: {
        fill: "#FFDD33",
        borderWidth: 1,
        borderColor: "white",
        r: 5,
      },
    },
  ], []);

  return (
    <VectorMap
      map={worldMill}
      backgroundColor="transparent"
      markerStyle={{
        initial: {
          fill: "#465FFF",
          r: 5, // Custom radius for markers
          stroke: "#383f47",
          strokeWidth: 1,
        } as any, // Type assertion to bypass strict CSS property checks
      }}
      markersSelectable={true}
      markers={chileMarkers}
      {...mapOptions}
      series={{
        regions: [{
          values: {
            CL: 1, // Using a number value instead of a color string
          },
          scale: [mapColor || "#D0D5DD", mapColor || "#465FFF"],
          attribute: 'fill'
        }]
      }}
      onMarkerTipShow={(event, label, index) => {
        // Type assertion for the label element
        if (label && typeof index === 'number' && index >= 0 && index < chileMarkers.length) {
          const labelElement = label as HTMLElement;
          labelElement.innerHTML = 
            '<div style="padding: 5px; background-color: #fff; color: #333; border-radius: 4px; font-size: 12px;">' +
            chileMarkers[index].name +
            '</div>';
        }
      }}
      regionStyle={{
        initial: {
          fill: "#D0D5DD",
          fillOpacity: 1,
          fontFamily: "Outfit",
          stroke: "#FFFFFF",
          strokeWidth: 0.5,
          strokeOpacity: 0.5,
        },
        hover: {
          fillOpacity: 0.7,
          cursor: "pointer",
          fill: "#465fff",
        },
        selected: {
          fill: mapColor || "#465FFF",
        },
        selectedHover: {},
      }}
      regionLabelStyle={{
        initial: {
          fill: "#35373e",
          fontWeight: 500,
          fontSize: "13px",
        },
        hover: {},
        selected: {},
        selectedHover: {},
      }}
    />
  );
};

export default CountryMap;