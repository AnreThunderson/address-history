import React, { useRef, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "YOUR_API_KEY"; // Replace with your actual API key

export default function AddressSearchMap() {
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 }); // Default to NYC
  const [address, setAddress] = useState("");
  const mapRef = useRef();

  const handleSearch = async (e) => {
    e.preventDefault();
    // Call Google Geocoding API
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await res.json();
    if (data.results && data.results.length) {
      const location = data.results[0].geometry.location;
      setCenter(location);
    } else {
      alert("Address not found!");
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Search address..."
        />
        <button type="submit">Search</button>
      </form>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          center={center}
          zoom={14}
          mapContainerStyle={{ width: "100%", height: "400px" }}
          onLoad={map => (mapRef.current = map)}
        >
          <Marker position={center} />
        </GoogleMap>
      </LoadScript>
    </div>
  );
}