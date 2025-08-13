"use client";
import React, { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

type Location = {
  id: number;
  address: string;
  latitude: number;
  longitude: number;
  history: string;
  createdAt: string;
};

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [history, setHistory] = useState("");
  const [search, setSearch] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [message, setMessage] = useState("");
  const [addressSearch, setAddressSearch] = useState(""); // New: for address lookup

  // Load Google Maps Script
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else if ((window as any).google && !map) {
      initMap();
    }
    // eslint-disable-next-line
  }, []);

  const initMap = () => {
    if (mapRef.current && (window as any).google) {
      const initial = { lat: 40.7128, lng: -74.006 }; // NYC default
      const m = new (window as any).google.maps.Map(mapRef.current, {
        center: initial,
        zoom: 10,
      });
      m.addListener("click", (e: google.maps.MapMouseEvent) => {
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (lat && lng) {
          setLocation({ lat, lng });
          placeMarker({ lat, lng }, m);
          fetchAddress(lat, lng);
        }
      });
      setMap(m);
    }
  };

  const placeMarker = (pos: { lat: number; lng: number }, m: google.maps.Map) => {
    if (marker) marker.setMap(null);
    const mk = new (window as any).google.maps.Marker({
      position: pos,
      map: m,
    });
    setMarker(mk);
    m.panTo(pos);
  };

  // Reverse geocode coordinates to address
  const fetchAddress = (lat: number, lng: number) => {
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
      if (status === "OK" && results && results.length > 0) {
        setAddress(results[0].formatted_address);
      } else {
        setAddress("");
      }
    });
  };

  // Search locations in DB
  const fetchLocations = async (q = "") => {
    const res = await fetch(`/api/locations${q ? "?address=" + encodeURIComponent(q) : ""}`);
    if (res.ok) setLocations(await res.json());
  };

  // On load, fetch all
  useEffect(() => {
    fetchLocations();
  }, []);

  // Save history to DB
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!address || !location || !history) {
      setMessage("Please select a location on the map and fill all fields.");
      return;
    }
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        latitude: location.lat,
        longitude: location.lng,
        history,
      }),
    });
    if (res.ok) {
      setMessage("Saved!");
      setAddress("");
      setHistory("");
      setLocation(null);
      setMarker(null);
      fetchLocations();
    } else {
      setMessage("Error saving location.");
    }
  };

  // Handle search for DB locations
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchLocations(search);
  };

  // NEW: Handle address search (geocode address and update map)
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressSearch) return;
    if (!(window as any).google) return;
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ address: addressSearch }, (results: any, status: any) => {
      if (status === "OK" && results && results.length > 0) {
        const loc = results[0].geometry.location;
        const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
        const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
        if (map) {
          placeMarker({ lat, lng }, map);
          map.setZoom(14);
        }
        setLocation({ lat, lng });
        setAddress(results[0].formatted_address);
        setMessage("");
      } else {
        setMessage("Address not found.");
      }
    });
  };

  // When user clicks a location in the list, show it on map
  const handleSelectLocation = (loc: Location) => {
    if (map) {
      placeMarker({ lat: loc.latitude, lng: loc.longitude }, map);
      map.setZoom(14);
    }
    setAddress(loc.address);
    setLocation({ lat: loc.latitude, lng: loc.longitude });
    setHistory(loc.history);
    setMessage("");
  };

  return (
    <main style={{ maxWidth: 600, margin: "30px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Address History App (with Google Maps)</h1>
      {/* Address Search bar */}
      <form onSubmit={handleAddressSearch} style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1, padding: 6 }}
          placeholder="Find address on map"
          value={addressSearch}
          onChange={e => setAddressSearch(e.target.value)}
        />
        <button type="submit" style={{ padding: "8px 12px" }}>Find</button>
      </form>
      <div>
        <div ref={mapRef} style={{ width: "100%", height: 350, marginBottom: 12, border: "1px solid #ccc" }} />
        <form onSubmit={handleSave} style={{ marginBottom: 16 }}>
          <div>
            <label>
              Address:
              <input
                style={{ width: "100%", margin: "6px 0", padding: 6 }}
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
            </label>
          </div>
          <div>
            <label>
              History:
              <textarea
                style={{ width: "100%", margin: "6px 0", padding: 6, minHeight: 60 }}
                value={history}
                onChange={e => setHistory(e.target.value)}
                required
              />
            </label>
          </div>
          <button type="submit" style={{ padding: "8px 16px", marginTop: 4 }}>Save</button>
          {message && <div style={{ marginTop: 8, color: message === "Saved!" ? "green" : "red" }}>{message}</div>}
        </form>
        <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
          <input
            style={{ width: "75%", padding: 6 }}
            placeholder="Search saved addresses"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" style={{ padding: "8px 12px", marginLeft: 6 }}>Search</button>
        </form>
        <div>
          <h2 style={{ fontSize: 20, margin: "12px 0" }}>Saved Locations</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {locations.map(loc => (
              <li
                key={loc.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  marginBottom: 8,
                  padding: 8,
                  cursor: "pointer",
                  background: address === loc.address ? "#f0f8ff" : "#fff"
                }}
                onClick={() => handleSelectLocation(loc)}
              >
                <strong>{loc.address}</strong>
                <div style={{ fontSize: 14, color: "#666" }}>{loc.history.slice(0, 80)}{loc.history.length > 80 && "..."}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}