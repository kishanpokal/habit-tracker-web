import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ritualis — Elevate Every Day | Sacred Habit Tracker";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0B0B0F 0%, #151522 50%, #07070A 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient background glows */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(124, 58, 237, 0.25)",
            filter: "blur(120px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(234, 179, 8, 0.2)",
            filter: "blur(120px)",
          }}
        />

        {/* Central Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(18, 18, 24, 0.85)",
            border: "2px solid rgba(124, 58, 237, 0.4)",
            borderRadius: "36px",
            padding: "50px 80px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Logo Symbol */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "90px",
              height: "90px",
              borderRadius: "24px",
              background: "#0B0B0F",
              border: "2px solid rgba(234, 179, 8, 0.4)",
              marginBottom: "24px",
              fontSize: "44px",
            }}
          >
            🔥
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Ritual
            <span
              style={{
                backgroundImage: "linear-gradient(90deg, #C084FC, #A855F7, #EAB308)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              is
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "0.25em",
              color: "#EAB308",
              textTransform: "uppercase",
              marginTop: "10px",
            }}
          >
            E L E V A T E   E V E R Y   D A Y
          </div>

          <div
            style={{
              fontSize: "20px",
              color: "#A0A0B2",
              marginTop: "20px",
              maxWidth: "700px",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            The Sacred Habit & Daily Routine Architecture • Streak Shields • Habit Stacking • Deep Analytics
          </div>

          {/* Feature Badges */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              marginTop: "32px",
            }}
          >
            {["Numeric Counters", "Routine Stacking", "Streak Freeze 🛡️", "Micro-Notes", "50+ Badges"].map((badge) => (
              <div
                key={badge}
                style={{
                  padding: "8px 18px",
                  borderRadius: "9999px",
                  background: "rgba(124, 58, 237, 0.15)",
                  border: "1px solid rgba(124, 58, 237, 0.35)",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
