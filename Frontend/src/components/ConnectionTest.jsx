import React, { useState } from "react";

export default function ConnectionTest() {
  const [status, setStatus] = useState("Not tested");

  const checkConnection = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/ping");
      const text = await res.text();

      if (text === "pong") {
        setStatus("🟢 Backend Connected");
      } else {
        setStatus("🟡 Received unexpected response");
      }
    } catch (error) {
      setStatus("🔴 Backend Not Connected");
    }
  };

  return (
    <div style={{ padding: "20px", fontSize: "20px" }}>
      <button
        onClick={checkConnection}
        style={{
          padding: "10px 20px",
          fontSize: "18px",
          cursor: "pointer",
          background: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px"
        }}
      >
        Test Backend Connection
      </button>

      <p style={{ marginTop: "20px", fontWeight: "bold" }}>{status}</p>
    </div>
  );
}
