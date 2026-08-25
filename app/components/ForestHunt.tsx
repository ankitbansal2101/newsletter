"use client";

import { useState, useCallback } from "react";

const orbs = [
  { id: 0, color: "sakura",   x: "85%", y: "65%", size: 22, label: "A faint glow catches your eye…" },
  { id: 1, color: "gold",     x: "10%", y: "30%", size: 26, label: "Another shimmer, somewhere new…" },
  { id: 2, color: "mint",     x: "70%", y: "18%", size: 20, label: "The path grows brighter…" },
  { id: 3, color: "lavender", x: "25%", y: "78%", size: 28, label: "One more light in the dark…" },
];

export default function ForestHunt() {
  const [collected, setCollected] = useState<number[]>([]);
  const [bursting, setBursting] = useState<number | null>(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  const activeIndex = collected.length;
  const allFound = activeIndex >= orbs.length;

  const collectOrb = useCallback((id: number) => {
    if (bursting !== null) return;
    setBursting(id);

    setTimeout(() => {
      setCollected((prev) => [...prev, id]);
      setBursting(null);

      if (id === orbs.length - 1) {
        setTimeout(() => {
          setPortalOpen(true);
          setTimeout(() => setPortalReady(true), 800);
        }, 600);
      }
    }, 700);
  }, [bursting]);

  return (
    <>
      {/* Orbs */}
      {orbs.map((orb, index) => {
        const isActive = index === activeIndex && !allFound;
        const isCollected = collected.includes(orb.id);
        const isBursting = bursting === orb.id;

        if (isCollected && !isBursting) return null;

        return (
          <button
            key={orb.id}
            className={`hunt-orb hunt-orb--${orb.color} ${isActive ? "hunt-orb--active" : ""} ${isBursting ? "hunt-orb--burst" : ""}`}
            style={{
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
            }}
            onClick={() => isActive && collectOrb(orb.id)}
            aria-label={orb.label}
            type="button"
          >
            <span className="hunt-orb-glow" />
            <span className="hunt-orb-ring" />
            {isBursting && (
              <>
                <span className="hunt-spark hunt-spark--1" />
                <span className="hunt-spark hunt-spark--2" />
                <span className="hunt-spark hunt-spark--3" />
                <span className="hunt-spark hunt-spark--4" />
                <span className="hunt-spark hunt-spark--5" />
                <span className="hunt-spark hunt-spark--6" />
              </>
            )}
          </button>
        );
      })}

      {/* Orb counter */}
      {collected.length > 0 && !allFound && (
        <div className="hunt-counter">
          {orbs.map((_, i) => (
            <span key={i} className={`hunt-pip ${i < collected.length ? "hunt-pip--lit" : ""} hunt-pip--${orbs[i].color}`} />
          ))}
        </div>
      )}

      {/* Portal */}
      {portalOpen && (
        <div className={`hunt-portal ${portalReady ? "hunt-portal--ready" : ""}`}>
          <div className="hunt-portal-backdrop" />
          <div className="hunt-portal-gate">
            <div className="hunt-portal-particles">
              {Array.from({ length: 20 }).map((_, i) => (
                <span
                  key={i}
                  className="hunt-portal-mote"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
            <div className="hunt-portal-arch">
              <span className="hunt-portal-rune">✦</span>
              <span className="hunt-portal-rune">✧</span>
              <span className="hunt-portal-rune">✦</span>
            </div>
            <div className="hunt-portal-inner">
              <p className="hunt-portal-whisper">You found the hidden path</p>
              <a href="/studio" className="hunt-portal-enter">
                <span>Enter the studio</span>
                <span className="hunt-portal-shimmer" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
