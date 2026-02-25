"use client";

import React, { useState } from "react";

export default function DebugFeedPage() {
    const [token, setToken] = useState("");
    const [feedData, setFeedData] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchFeed = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/feed", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            setFeedData(data.feed || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch feed");
        } finally {
            setLoading(false);
        }
    };

    const calculateApproxKm = (distSq: number | null) => {
        if (distSq === null || distSq === undefined) return "N/A";
        const degrees = Math.sqrt(distSq);
        const km = degrees * 111; // 1 degree lat/lon is roughly 111km
        return km.toFixed(2);
    };

    return (
        <div style={{ padding: "20px", fontFamily: "monospace", maxWidth: "800px", margin: "0 auto" }}>
            <h1>Feed Visualization Harness</h1>
            <p style={{ marginBottom: "20px" }}>Paste a valid JWT below to test the matching algorithm.</p>

            <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexDirection: "column" }}>
                <textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    style={{ width: "100%", height: "80px", padding: "10px", fontFamily: "monospace" }}
                />
                <button
                    onClick={fetchFeed}
                    disabled={loading || !token.trim()}
                    style={{ padding: "10px", cursor: "pointer", alignSelf: "flex-start", fontSize: "16px" }}
                >
                    {loading ? "Loading..." : "Load Feed"}
                </button>
            </div>

            {error && <div style={{ color: "red", marginBottom: "20px" }}><strong>Error:</strong> {error}</div>}

            {feedData && (
                <div>
                    <h2>Results ({feedData.length})</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {feedData.length === 0 && <p>No users found in feed.</p>}
                        {feedData.map((user, idx) => (
                            <div key={user.id || idx} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "5px", background: "#f9f9f9", color: "#333" }}>
                                <h3 style={{ margin: "0 0 10px 0" }}>#{idx + 1} - {user.name}</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                                    <div><strong>Distance:</strong> {calculateApproxKm(user._distanceSq)} {user._distanceSq !== null ? 'km' : ''}</div>
                                    <div><strong>Final Score:</strong> {user._finalScore?.toFixed(2) ?? 'N/A'}</div>

                                    <div><strong>Exact Matches:</strong> {user._exactMatches ?? 0}</div>
                                    <div><strong>Interest Score:</strong> {user._interestScore?.toFixed(2) ?? 'N/A'}</div>

                                    <div><strong>Parent-Child Matches:</strong> {user._parentChildMatches ?? 0}</div>
                                    <div><strong>Distance Penalty:</strong> {user._distancePenalty?.toFixed(2) ?? 'N/A'}</div>

                                    <div><strong>Category Matches:</strong> {user._sameCategoryMatches ?? 0}</div>
                                </div>

                                <div>
                                    <strong>Interests:</strong>
                                    <pre style={{ background: "#eee", padding: "10px", overflowX: "auto", fontSize: "12px", border: "1px solid #ddd" }}>
                                        {JSON.stringify(user.interests, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
