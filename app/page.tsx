import type { CSSProperties } from "react";
import { Suspense } from "react";
import LedBannerApp from "@/components/LedBannerApp";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          className="led-root"
          style={
            {
              "--banner-color": "#00ff88",
              "--banner-bg": "#0a0a0f",
            } as CSSProperties
          }
        >
          <div className="led-stage" style={{ justifyContent: "center" }}>
            <span className="led-chunk" style={{ fontSize: "clamp(1.5rem, 8vw, 3rem)" }}>
              Chargement…
            </span>
          </div>
        </div>
      }
    >
      <LedBannerApp />
    </Suspense>
  );
}
