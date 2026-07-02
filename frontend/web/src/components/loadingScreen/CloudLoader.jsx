import React, { useState, useEffect, useMemo } from "react";
import {
  Image as ImageIcon,
  FileText,
  Folder,
  Video,
  File as FileIcon,
  Sparkles,
} from "lucide-react";

/**
 * CloudLoader
 * -------------------
 * Premium, full-screen loading experience for a cloud storage product.
 * Pure React + Tailwind + CSS keyframes (no external animation library,
 * so it drops into any React project — Framer Motion optional, not required).
 *
 * Palette:
 *  Primary   #2563EB
 *  Secondary #60A5FA
 *  Accent    #38BDF8
 *  Text      #0F172A
 */

const STAGES = [
  { max: 15, label: "Initializing Cloud..." },
  { max: 40, label: "Connecting Secure Storage..." },
  { max: 65, label: "Encrypting Files..." },
  { max: 90, label: "Syncing Data..." },
  { max: 99, label: "Almost Ready..." },
  { max: 100, label: "Welcome to the Cloud" },
];

function getStage(p) {
  return STAGES.find((s) => p <= s.max) || STAGES[STAGES.length - 1];
}

// Cloud silhouette, viewBox 0 0 190 130
const CLOUD_PATH =
  "M45,115 C25,115 10,100 10,82 C10,64 25,50 44,50 C48,28 68,12 92,12 " +
  "C116,12 136,28 140,50 C160,48 178,64 178,84 C178,102 162,115 143,115 Z";

const CLOUD_TOP = 12;
const CLOUD_BOTTOM = 116;

// each file type carries an icon + a short extension label, reused for the
// corner cards, the risers, AND the bubbles inside the liquid so the whole
// scene tells one consistent story: "your files, syncing into the cloud"
const FILE_TYPES = [
  { Icon: Video, ext: "MP4", tint: "#2563EB" },
  { Icon: ImageIcon, ext: "PNG", tint: "#38BDF8" },
  { Icon: FileText, ext: "PDF", tint: "#60A5FA" },
  { Icon: Folder, ext: "ZIP", tint: "#2563EB" },
  { Icon: FileIcon, ext: "DOC", tint: "#38BDF8" },
];

export default function CloudLoader({ onComplete }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (percent >= 100) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 600);

      return () => clearTimeout(timer);
    }

    const t = setTimeout(() => {
      setPercent((p) => Math.min(100, p + (Math.random() * 3.2 + 1.1)));
    }, 130);

    return () => clearTimeout(t);
  }, [percent, onComplete]);

  const roundedPercent = Math.floor(percent);
  const stage = getStage(roundedPercent);
  const complete = percent >= 100;

  const fillY = CLOUD_BOTTOM - (percent / 100) * (CLOUD_BOTTOM - CLOUD_TOP);
  const zoom = 1 + Math.min(percent, 100) * 0.0009; // slight camera zoom-in

  // ---- randomized decorative layers (memoized so they don't reshuffle each render) ----
  const bgClouds = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        id: i,
        top: Math.random() * 65 + 2,
        left: Math.random() * 90,
        scale: Math.random() * 0.9 + 0.45,
        duration: Math.random() * 22 + 26,
        blur: Math.random() * 5 + 3,
        opacity: Math.random() * 0.25 + 0.12,
        delay: -Math.random() * 30,
        dir: i % 2 === 0 ? 1 : -1,
      })),
    []
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 3 + 1.5,
        duration: Math.random() * 12 + 10,
        delay: -Math.random() * 20,
        opacity: Math.random() * 0.5 + 0.25,
      })),
    []
  );

  const glassCards = useMemo(
    () => [
      { top: "14%", left: "8%", w: 72, h: 72, rot: -8, dur: 14, type: FILE_TYPES[0] },
      { top: "70%", left: "12%", w: 72, h: 72, rot: 10, dur: 17, type: FILE_TYPES[1] },
      { top: "20%", left: "82%", w: 72, h: 72, rot: 6, dur: 15, type: FILE_TYPES[2] },
      { top: "68%", left: "84%", w: 72, h: 72, rot: -12, dur: 19, type: FILE_TYPES[4] },
    ],
    []
  );

  // bubbles rising through the liquid now cycle through the same file
  // types as everything else: a video bubble, then an image bubble, a
  // pdf bubble, and so on — instead of plain, generic dots.
  const bubbles = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        cx: 40 + Math.random() * 110,
        size: Math.random() * 5 + 13,
        duration: Math.random() * 4 + 3.5,
        delay: -Math.random() * 6,
        type: FILE_TYPES[i % FILE_TYPES.length],
      })),
    []
  );

  const risers = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        type: FILE_TYPES[i % FILE_TYPES.length],
        left: 32 + Math.random() * 36,
        duration: Math.random() * 3.5 + 6,
        delay: -Math.random() * 9,
      })),
    []
  );

  const arrows = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, i) => ({
        id: i,
        left: 40 + Math.random() * 20,
        duration: Math.random() * 2.5 + 4,
        delay: -Math.random() * 6,
      })),
    []
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        angle: (360 / 8) * i,
        radius: 96 + Math.random() * 30,
        delay: Math.random() * 3,
        duration: Math.random() * 1.6 + 1.8,
      })),
    []
  );

  const rays = useMemo(
    () =>
      Array.from({ length: 4 }).map((_, i) => ({
        id: i,
        left: 10 + i * 24 + Math.random() * 6,
        rot: -18 + Math.random() * 10,
        duration: Math.random() * 6 + 8,
        delay: -Math.random() * 8,
      })),
    []
  );

  return (
    <div
      className="relative h-screen w-screen overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(160deg, #ffffff 0%, #EAF4FE 38%, #DCF3FB 68%, #CFF2FA 100%)",
      }}
    >
      <style>{`
        @keyframes floatCloud {
          0%   { transform: translate(0px, 0px) scale(var(--s)); }
          50%  { transform: translate(calc(24px * var(--dir)), -16px) scale(var(--s)); }
          100% { transform: translate(0px, 0px) scale(var(--s)); }
        }
        @keyframes driftParticle {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: var(--o); }
          90%  { opacity: var(--o); }
          100% { transform: translateY(-110vh) translateX(18px); opacity: 0; }
        }
        @keyframes floatCard {
          0%,100% { transform: translateY(0) rotate(var(--r)); }
          50%     { transform: translateY(-18px) rotate(calc(var(--r) + 2deg)); }
        }
        @keyframes meshShift {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(3%, -4%) scale(1.08); }
        }
        @keyframes mistDrift {
          0%   { transform: translateX(-6%); opacity: .35; }
          50%  { transform: translateX(6%); opacity: .55; }
          100% { transform: translateX(-6%); opacity: .35; }
        }
        @keyframes rayFade {
          0%,100% { opacity: .05; transform: translateY(0) rotate(var(--rot)); }
          50%     { opacity: .18; transform: translateY(30px) rotate(var(--rot)); }
        }
        @keyframes waveScrollA {
          from { transform: translateX(0); }
          to   { transform: translateX(-190px); }
        }
        @keyframes waveScrollB {
          from { transform: translateX(-190px); }
          to   { transform: translateX(0); }
        }
        @keyframes bubbleRise {
          0%   { transform: translateY(0) scale(.6); opacity: 0; }
          15%  { opacity: 1; transform: translateY(-10px) scale(1); }
          85%  { opacity: .85; }
          100% { transform: translateY(-96px) scale(.7); opacity: 0; }
        }
        @keyframes cloudGlowPulse {
          0%,100% { opacity: .55; transform: scale(1); }
          50%     { opacity: .9;  transform: scale(1.12); }
        }
        @keyframes gentlePulse {
          0%,100% { filter: drop-shadow(0 0 18px rgba(56,189,248,.55)); }
          50%     { filter: drop-shadow(0 0 34px rgba(37,99,235,.75)); }
        }
        @keyframes sparkleTwinkle {
          0%,100% { opacity: 0; transform: scale(.4) rotate(0deg); }
          50%     { opacity: 1; transform: scale(1) rotate(20deg); }
        }
        @keyframes fileRise {
          0%   { transform: translateY(0) scale(.7); opacity: 0; }
          15%  { opacity: .9; }
          75%  { opacity: .55; }
          100% { transform: translateY(-230px) scale(.35); opacity: 0; }
        }
        @keyframes arrowRise {
          0%   { transform: translateY(0); opacity: 0; }
          20%  { opacity: .8; }
          100% { transform: translateY(-190px); opacity: 0; }
        }
        @keyframes shimmerBar {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes softBob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-9px); }
        }
      `}</style>

      {/* ---------------- gradient mesh blobs ---------------- */}
      <div
        className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(96,165,250,0.35), transparent 70%)",
          animation: "meshShift 16s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-32 -right-16 h-[480px] w-[480px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.3), transparent 70%)",
          animation: "meshShift 20s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.12), transparent 72%)",
        }}
      />

      {/* ---------------- light rays ---------------- */}
      {rays.map((r) => (
        <div
          key={r.id}
          className="absolute top-0 h-[140%] w-[3px]"
          style={{
            left: `${r.left}%`,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(56,189,248,0) 70%)",
            "--rot": `${r.rot}deg`,
            animation: `rayFade ${r.duration}s ease-in-out infinite`,
            animationDelay: `${r.delay}s`,
          }}
        />
      ))}

      {/* ---------------- floating background clouds (parallax) ---------------- */}
      {bgClouds.map((c) => (
        <svg
          key={c.id}
          viewBox="0 0 190 130"
          className="absolute h-32 w-44"
          style={{
            top: `${c.top}%`,
            left: `${c.left}%`,
            filter: `blur(${c.blur}px)`,
            opacity: c.opacity,
            "--s": c.scale,
            "--dir": c.dir,
            animation: `floatCloud ${c.duration}s ease-in-out infinite`,
            animationDelay: `${c.delay}s`,
          }}
        >
          <path d={CLOUD_PATH} fill="#ffffff" />
        </svg>
      ))}

      {/* ---------------- animated mist ---------------- */}
      <div
        className="absolute bottom-0 left-0 h-40 w-[130%]"
        style={{
          background:
            "linear-gradient(to top, rgba(255,255,255,0.6), transparent)",
          animation: "mistDrift 14s ease-in-out infinite",
        }}
      />

      {/* ---------------- glassmorphism cards (file types) ---------------- */}
      {glassCards.map((g, i) => {
        const { Icon, ext, tint } = g.type;
        return (
          <div
            key={i}
            className="absolute flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/50 bg-white/25 shadow-lg backdrop-blur-md"
            style={{
              top: g.top,
              left: g.left,
              width: g.w,
              height: g.h,
              "--r": `${g.rot}deg`,
              transform: `rotate(${g.rot}deg)`,
              animation: `floatCard ${g.dur}s ease-in-out infinite`,
            }}
          >
            <Icon
              size={24}
              color={tint}
              strokeWidth={1.9}
              style={{ transform: `rotate(${-g.rot}deg)`, opacity: 0.9 }}
            />
            <span
              className="text-[8px] font-bold tracking-wider"
              style={{ color: tint, opacity: 0.7, transform: `rotate(${-g.rot}deg)` }}
            >
              {ext}
            </span>
          </div>
        );
      })}

      {/* ---------------- drifting particles ---------------- */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 rounded-full bg-[#38BDF8]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            "--o": p.opacity,
            boxShadow: "0 0 6px rgba(56,189,248,0.8)",
            animation: `driftParticle ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* ---------------- centerpiece ---------------- */}
      <div
        className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6"
        style={{ transform: `scale(${zoom})`, transition: "transform 0.6s ease-out" }}
      >
        {/* wordmark */}
        <div
          className="mb-6 flex items-center gap-2 text-xs font-semibold tracking-[0.35em] text-[#2563EB]/70"
          style={{ animation: "softBob 6s ease-in-out infinite" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
          PERSONAL&nbsp;CLOUD
        </div>

        {/* cloud + glow + effects wrapper */}
        <div className="relative flex items-center justify-center" style={{ width: 260, height: 200 }}>
          {/* ambient glow behind cloud */}
          <div
            className="absolute h-56 w-56 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(96,165,250,0.55), rgba(56,189,248,0.15) 60%, transparent 75%)",
              filter: "blur(18px)",
              animation: complete
                ? "cloudGlowPulse 2.2s ease-in-out infinite"
                : "cloudGlowPulse 4.5s ease-in-out infinite",
            }}
          />

          {/* sparkles orbiting the cloud */}
          {sparkles.map((s) => (
            <Sparkles
              key={s.id}
              size={14}
              className="absolute text-[#60A5FA]"
              style={{
                top: "50%",
                left: "50%",
                transform: `translate(-50%,-50%) rotate(${s.angle}deg) translate(${s.radius}px) rotate(-${s.angle}deg)`,
                animation: `sparkleTwinkle ${s.duration}s ease-in-out infinite`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}

          {/* upload arrows rising toward the cloud */}
          {arrows.map((a) => (
            <svg
              key={a.id}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="absolute bottom-2"
              style={{
                left: `${a.left}%`,
                animation: `arrowRise ${a.duration}s ease-in infinite`,
                animationDelay: `${a.delay}s`,
              }}
            >
              <path
                d="M12 19V5M12 5l-6 6M12 5l6 6"
                stroke="#2563EB"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ))}

          {/* tiny file icons floating up and disappearing into the cloud */}
          {risers.map((f) => {
            const { Icon, tint } = f.type;
            return (
              <div
                key={f.id}
                className="absolute bottom-0 rounded-md bg-white/80 p-1 shadow-md backdrop-blur-sm"
                style={{
                  left: `${f.left}%`,
                  animation: `fileRise ${f.duration}s ease-in infinite`,
                  animationDelay: `${f.delay}s`,
                }}
              >
                <Icon size={14} color={tint} strokeWidth={2.2} />
              </div>
            );
          })}

          {/* the cloud itself */}
          <svg
            viewBox="0 0 190 130"
            className="relative h-48 w-64"
            style={{
              animation: complete ? "gentlePulse 2.4s ease-in-out infinite" : "none",
              filter: complete
                ? undefined
                : "drop-shadow(0 6px 24px rgba(37,99,235,0.18))",
            }}
          >
            <defs>
              <clipPath id="cloudClip">
                <path d={CLOUD_PATH} />
              </clipPath>
              <linearGradient id="liquidGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="55%" stopColor="#2f7bf2" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
              <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93D8FB" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>

            {/* base cloud (white) */}
            <path d={CLOUD_PATH} fill="#FFFFFF" stroke="#DCEEFE" strokeWidth="1.5" />

            {/* liquid fill, clipped to cloud shape */}
            <g clipPath="url(#cloudClip)">
              {/* solid fill body beneath the wave crest */}
              <rect
                x="0"
                y={fillY}
                width="190"
                height={CLOUD_BOTTOM - fillY + 20}
                fill="url(#liquidGradient)"
                style={{ transition: "y 0.35s ease-out, height 0.35s ease-out" }}
              />

              {/* wave layer 1 */}
              <g style={{ transform: `translateY(${fillY - 8}px)`, transition: "transform 0.35s ease-out" }}>
                <path
                  d="M-190,6 C-166.25,-4 -118.75,16 -95,6 C-71.25,-4 -23.75,16 0,6 C23.75,-4 71.25,16 95,6 C118.75,-4 166.25,16 190,6 C213.75,-4 261.25,16 285,6 C308.75,-4 356.25,16 380,6 L380,60 L-190,60 Z"
                  fill="url(#waveGradient)"
                  opacity="0.9"
                  style={{ animation: "waveScrollA 3.2s linear infinite" }}
                />
              </g>
              {/* wave layer 2 (depth) */}
              <g style={{ transform: `translateY(${fillY - 3}px)`, transition: "transform 0.35s ease-out" }}>
                <path
                  d="M-190,8 C-166.25,18 -118.75,-2 -95,8 C-71.25,18 -23.75,-2 0,8 C23.75,18 71.25,-2 95,8 C118.75,18 166.25,-2 190,8 C213.75,18 261.25,-2 285,8 C308.75,18 356.25,-2 380,8 L380,60 L-190,60 Z"
                  fill="#2563EB"
                  opacity="0.55"
                  style={{ animation: "waveScrollB 4.6s linear infinite" }}
                />
              </g>

              {/* rising bubbles — now tiny file-type chips (mp4, png, pdf, zip, doc)
                  instead of plain dots, cycling through the same set used by the
                  corner cards and the risers so the whole scene reads as one story */}
              {bubbles.map((b) => {
                const { Icon, tint } = b.type;
                return (
                  <foreignObject
                    key={b.id}
                    x={b.cx - b.size / 2}
                    y={CLOUD_BOTTOM - b.size / 2}
                    width={b.size}
                    height={b.size}
                    style={{
                      animation: `bubbleRise ${b.duration}s ease-in infinite`,
                      animationDelay: `${b.delay}s`,
                      overflow: "visible",
                    }}
                  >
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "9999px",
                        background: "rgba(255,255,255,0.92)",
                        boxShadow: "0 0 5px rgba(255,255,255,0.85)",
                      }}
                    >
                      <Icon size={b.size * 0.58} color={tint} strokeWidth={2.4} />
                    </div>
                  </foreignObject>
                );
              })}
            </g>

            {/* soft inner outline for definition */}
            <path
              d={CLOUD_PATH}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.6"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* ---------------- loading indicator ---------------- */}
        <div className="mt-10 flex w-[min(380px,84vw)] flex-col items-center gap-3">
          {/* <div className="flex items-baseline gap-1 tabular-nums"> */}
            {/* <span className="text-4xl font-bold tracking-tight text-[#0F172A]">
              {roundedPercent}
            </span> */}
            {/* <span className="text-lg font-semibold text-[#0F172A]/50">%</span> */}
          {/* </div> */}

          <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-white/60 bg-white/50 shadow-inner backdrop-blur-sm">
            <div
              className="h-full rounded-full"
              style={{
                width: `${percent}%`,
                background: "linear-gradient(90deg, #2563EB, #38BDF8)",
                transition: "width 0.25s ease-out",
                boxShadow: "0 0 10px rgba(56,189,248,0.6)",
              }}
            />
            <div
              className="absolute top-0 h-full w-1/3 skew-x-[-20deg]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)",
                animation: "shimmerBar 1.8s linear infinite",
              }}
            />
          </div>

          <div
            key={stage.label}
            className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#2563EB]/80"
            style={{ animation: "fadeSlideIn 0.4s ease-out" }}
          >
            {stage.label}
          </div>
        </div>
      </div>
    </div>
  );
}