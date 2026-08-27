import { useCallback, useState } from "react";

export interface UserCoordinates {
  lat: number;
  lng: number;
}

export const DISTRICT_FALLBACK_COORDINATES: Record<string, UserCoordinates> = {
  Sitamarhi: { lat: 26.5944, lng: 85.4892 },
  Muzaffarpur: { lat: 26.1209, lng: 85.3647 },
  Sheohar: { lat: 26.5173, lng: 85.2952 },
  Motihari: { lat: 26.6469, lng: 84.9089 },
};

export function useUserLocation() {
  const [coords, setCoords] = useState<UserCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Location services are not available on this device.");
      return;
    }

    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setCoords({ lat: position.latitude, lng: position.longitude });
        setLoading(false);
      },
      (positionError) => {
        setError(getGeolocationError(positionError.code));
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 },
    );
  }, []);

  const setManualDistrict = useCallback((districtName: string) => {
    const fallback = DISTRICT_FALLBACK_COORDINATES[districtName];
    if (!fallback) {
      setError("That district does not have a fallback location.");
      return;
    }
    setCoords(fallback);
    setError(null);
  }, []);

  return { coords, loading, error, requestGPS, setManualDistrict };
}

function getGeolocationError(code: number) {
  if (code === 1) return "Location permission was denied. Choose a district instead.";
  if (code === 2) return "Your location could not be determined. Choose a district instead.";
  if (code === 3) return "Location request timed out. Please try again or choose a district.";
  return "Unable to access your location. Choose a district instead.";
}
