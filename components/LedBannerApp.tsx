"use client";

import type { CSSProperties } from "react";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseBannerParams,
  paramsToQueryString,
  type BannerParams,
} from "@/lib/banner-params";

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", onStoreChange);
      return () => m.removeEventListener("change", onStoreChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  }, [query]);
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function LedBannerApp() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromUrl = useMemo(
    () => parseBannerParams(searchParams),
    [searchParams],
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<BannerParams>(fromUrl);
  const [toast, setToast] = useState<string | null>(null);

  const isCoarse = useMediaQuery("(pointer: coarse)");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  const applyDraftToUrl = useCallback(() => {
    const qs = paramsToQueryString(draft);
    router.replace(`${pathname}?${qs}`);
    setPanelOpen(false);
    showToast("Appliqué");
  }, [draft, pathname, router, showToast]);

  const copyLink = useCallback(async () => {
    const qs = paramsToQueryString(fromUrl);
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}?${qs}`
        : "";

    try {
      if (navigator.share && isCoarse) {
        await navigator.share({ title: "LED Banner", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast("Lien copié");
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        showToast("Lien copié");
      } catch {
        showToast("Impossible de copier");
      }
    }
  }, [fromUrl, isCoarse, showToast]);

  const openPanel = useCallback(() => {
    setDraft(fromUrl);
    setPanelOpen(true);
  }, [fromUrl]);

  const displayText = `${fromUrl.text}   •   `;

  return (
    <>
      <div
        className="led-root"
        style={
          {
            "--banner-color": fromUrl.color,
            "--banner-bg": fromUrl.background,
            "--led-duration": `${fromUrl.speedSec}s`,
          } as CSSProperties
        }
      >
        <div className="led-stage">
          <div
            className="led-track led-track-animated"
            data-direction={fromUrl.direction}
            style={{ fontSize: fromUrl.fontSize }}
          >
            <span className="led-chunk" aria-hidden>
              {displayText}
            </span>
            <span className="led-chunk">{displayText}</span>
          </div>
        </div>

        <div className="led-controls">
          <button type="button" className="led-btn" onClick={copyLink}>
            Partager / copier
          </button>
          <button type="button" className="led-btn" onClick={openPanel}>
            Réglages
          </button>
        </div>
      </div>

      <div
        className="led-panel-backdrop"
        data-open={panelOpen}
        onClick={() => setPanelOpen(false)}
        aria-hidden
      />

      <aside className="led-panel" data-open={panelOpen} role="dialog">
        <h2>Paramètres</h2>

        <div className="led-field">
          <label htmlFor="led-text">Texte</label>
          <input
            id="led-text"
            value={draft.text}
            onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
            autoComplete="off"
            enterKeyHint="done"
          />
        </div>

        <div className="led-row">
          <div className="led-field">
            <label htmlFor="led-color">Couleur LED</label>
            <input
              id="led-color"
              type="color"
              value={draft.color}
              onChange={(e) =>
                setDraft((d) => ({ ...d, color: e.target.value }))
              }
            />
          </div>
          <div className="led-field">
            <label htmlFor="led-bg">Fond</label>
            <input
              id="led-bg"
              type="color"
              value={draft.background}
              onChange={(e) =>
                setDraft((d) => ({ ...d, background: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="led-row">
          <div className="led-field">
            <label htmlFor="led-speed">Vitesse (s)</label>
            <input
              id="led-speed"
              type="number"
              min={2}
              max={120}
              step={1}
              value={draft.speedSec}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v))
                  setDraft((d) => ({
                    ...d,
                    speedSec: Math.min(120, Math.max(2, v)),
                  }));
              }}
            />
          </div>
          <div className="led-field">
            <label htmlFor="led-dir">Sens</label>
            <select
              id="led-dir"
              value={draft.direction}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  direction: e.target.value as "left" | "right",
                }))
              }
              className="led-select"
            >
              <option value="left">Gauche</option>
              <option value="right">Droite</option>
            </select>
          </div>
        </div>

        <div className="led-field">
          <label htmlFor="led-size">Taille (vw, ~4–20)</label>
          <input
            id="led-size"
            type="range"
            min={4}
            max={22}
            step={1}
            value={
              parseFloat(draft.fontSize.match(/(\d+(?:\.\d+)?)vw/)?.[1] ?? "11") ||
              11
            }
            onChange={(e) => {
              const s = parseFloat(e.target.value);
              setDraft((d) => ({
                ...d,
                fontSize: `clamp(${Math.max(0.8, s * 0.35)}rem, ${s}vw, ${Math.min(8, s * 1.2)}rem)`,
              }));
            }}
          />
        </div>

        <button type="button" className="led-btn" onClick={applyDraftToUrl}>
          Appliquer à l’URL
        </button>
      </aside>

      <div className="led-toast" data-visible={toast !== null} role="status">
        {toast}
      </div>
    </>
  );
}
