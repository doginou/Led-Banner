"use client";

import type { CSSProperties } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  fontSizeCssFromVw,
  parseBannerParams,
  parseVwFromFontSize,
  paramsToQueryString,
  type BannerParams,
} from "@/lib/banner-params";
import { SWEDEN_PRESETS } from "@/lib/sweden-presets";

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

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const segmentRef = useRef<HTMLSpanElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<BannerParams>(fromUrl);
  const [toast, setToast] = useState<string | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [nativeFs, setNativeFs] = useState(false);

  const isCoarse = useMediaQuery("(pointer: coarse)");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => {
    const sync = () => {
      setNativeFs(document.fullscreenElement === rootRef.current);
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const applyDraftToUrl = useCallback(() => {
    const qs = paramsToQueryString(draft);
    router.replace(`${pathname}?${qs}`);
    setPanelOpen(false);
    showToast("Appliqué");
  }, [draft, pathname, router, showToast]);

  const applyPreset = useCallback(
    (bannerText: string) => {
      const next: BannerParams = { ...fromUrl, text: bannerText };
      router.replace(`${pathname}?${paramsToQueryString(next)}`);
      setDraft(next);
      setPanelOpen(false);
      showToast("Preset appliqué");
    },
    [fromUrl, pathname, router, showToast],
  );

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

  const toggleFullscreen = useCallback(async () => {
    if (immersive) {
      setImmersive(false);
      return;
    }
    const el = rootRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      await el.requestFullscreen();
    } catch {
      setImmersive(true);
      showToast("Mode immersif");
    }
  }, [immersive, showToast]);

  const exitAllFullscreen = useCallback(async () => {
    setImmersive(false);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const inExpandedView = nativeFs || immersive;
  const displayText = `${fromUrl.text}   •   `;

  useLayoutEffect(() => {
    const track = trackRef.current;
    const seg = segmentRef.current;
    if (!track || !seg) return;

    const syncShift = () => {
      const w = seg.getBoundingClientRect().width;
      if (w > 0) track.style.setProperty("--led-marquee-shift", `-${w}px`);
    };

    syncShift();

    const ro = new ResizeObserver(syncShift);
    ro.observe(seg);

    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(syncShift);
    }

    return () => ro.disconnect();
  }, [displayText, fromUrl.fontSize]);
  const speedSlider = draft.speedSec;
  const sizeVw = parseVwFromFontSize(draft.fontSize, 11);

  return (
    <>
      <div
        ref={rootRef}
        className="led-root"
        data-immersive={immersive ? "true" : undefined}
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
            ref={trackRef}
            className="led-track led-track-animated"
            data-direction={fromUrl.direction}
            style={{ fontSize: fromUrl.fontSize }}
          >
            <span ref={segmentRef} className="led-chunk" aria-hidden>
              {displayText}
            </span>
            <span className="led-chunk">{displayText}</span>
          </div>
        </div>

        <div className="led-controls">
          <button type="button" className="led-btn" onClick={toggleFullscreen}>
            {inExpandedView ? "Quitter plein écran" : "Plein écran"}
          </button>
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

        <details className="led-presets">
          <summary>Presets · Suède</summary>
          <ul className="led-presets-list">
            {SWEDEN_PRESETS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="led-preset-btn"
                  onClick={() => applyPreset(p.bannerText)}
                >
                  {p.labelFr}
                </button>
              </li>
            ))}
          </ul>
        </details>

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

        <div className="led-field">
          <div className="led-label-row">
            <label htmlFor="led-speed">Vitesse du défilement</label>
            <span className="led-range-value">{speedSlider} s</span>
          </div>
          <input
            id="led-speed"
            type="range"
            className="led-range"
            min={2}
            max={120}
            step={1}
            value={speedSlider}
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

        <div className="led-field">
          <div className="led-label-row">
            <label htmlFor="led-size">Taille du texte</label>
            <span className="led-range-value">{Math.round(sizeVw)} vw</span>
          </div>
          <input
            id="led-size"
            type="range"
            className="led-range"
            min={4}
            max={22}
            step={1}
            value={Math.round(sizeVw)}
            onChange={(e) => {
              const s = parseFloat(e.target.value);
              setDraft((d) => ({
                ...d,
                fontSize: fontSizeCssFromVw(s),
              }));
            }}
          />
        </div>

        <button type="button" className="led-btn" onClick={applyDraftToUrl}>
          Appliquer à l’URL
        </button>
      </aside>

      {inExpandedView ? (
        <button
          type="button"
          className="led-fs-exit"
          onClick={exitAllFullscreen}
          aria-label="Quitter le plein écran"
        >
          ✕
        </button>
      ) : null}

      <div className="led-toast" data-visible={toast !== null} role="status">
        {toast}
      </div>
    </>
  );
}
