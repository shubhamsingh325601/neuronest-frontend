"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { siteConfig } from "@/content/site";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the pre-paint script already activated splash
    const isPending =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("splash-pending");

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const hasSeen = sessionStorage.getItem("neuronest_splash_seen");

    if ((isPending || !hasSeen) && !prefersReducedMotion) {
      setIsVisible(true);

      const timer = setTimeout(() => {
        // Remove class before exit fade so underlying page becomes interactive
        document.documentElement.classList.remove("splash-pending");
        sessionStorage.setItem("neuronest_splash_seen", "true");
        setIsVisible(false);
      }, 2300);

      return () => clearTimeout(timer);
    } else {
      document.documentElement.classList.remove("splash-pending");
    }
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          id="splash-root"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FBF3EC] pointer-events-none select-none"
        >
          {/* Main Visual Animation Box */}
          <div className="relative w-64 h-52 flex items-center justify-center">
            {/* Background Ambient Warmth Glow */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{
                scale: [0.7, 1.25, 1.05],
                opacity: [0, 0.35, 0.2],
              }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              className="absolute w-44 h-44 rounded-full bg-[#E2775B]/25 blur-2xl"
            />

            <svg
              viewBox="0 0 240 180"
              className="w-64 h-52 overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Definitions for Gradients and Shadows */}
              <defs>
                <linearGradient id="birdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E2775B" />
                  <stop offset="100%" stopColor="#C85F45" />
                </linearGradient>
                <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E2775B" />
                  <stop offset="70%" stopColor="#C85F45" />
                  <stop offset="100%" stopColor="#A64B32" />
                </linearGradient>
                <radialGradient id="nestBed" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FBE3DA" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#F5E6C6" stopOpacity="0.4" />
                </radialGradient>
              </defs>

              {/* 1. Touchdown Energy Ripple (expands when bird lands at 1.4s) */}
              <motion.ellipse
                cx="120"
                cy="126"
                rx="30"
                ry="10"
                stroke="#E2775B"
                strokeWidth="1.5"
                fill="none"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{
                  scale: [0.3, 1.8],
                  opacity: [0, 0.7, 0],
                }}
                transition={{
                  delay: 1.35,
                  duration: 0.75,
                  ease: "easeOut",
                }}
              />

              {/* 2. Floating Heart / Love Sparkle rising on arrival */}
              <motion.path
                d="M120 72 C118 68 114 68 112 71 C110 74 113 78 120 84 C127 78 130 74 128 71 C126 68 122 68 120 72Z"
                fill="#E2775B"
                initial={{ scale: 0, opacity: 0, y: 10 }}
                animate={{
                  scale: [0, 1.25, 0.9],
                  opacity: [0, 0.9, 0],
                  y: [10, -12, -26],
                }}
                transition={{
                  delay: 1.4,
                  duration: 0.85,
                  ease: "easeOut",
                }}
              />

              {/* 3. The Woven Nest (with spring physics compression on landing) */}
              <motion.g
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [15, 0, 0, 3, -1, 0],
                }}
                transition={{
                  times: [0, 0.2, 0.65, 0.75, 0.85, 1],
                  duration: 2.1,
                  ease: "easeOut",
                }}
              >
                {/* Soft ground shadow */}
                <ellipse cx="120" cy="144" rx="60" ry="12" fill="#EBDFD3" opacity="0.8" />

                {/* Left Branch & Green Leaves (unfurl into place) */}
                <motion.g
                  initial={{ rotate: -15, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <path
                    d="M62 136 C50 128 42 134 38 142 C46 144 56 141 62 136Z"
                    fill="#6E8261"
                  />
                  <path
                    d="M48 131 C40 125 35 128 32 134 C38 136 45 134 48 131Z"
                    fill="#566A4B"
                  />
                  <path
                    d="M72 142 C60 144 55 150 54 156 C61 156 68 152 72 142Z"
                    fill="#6E8261"
                    opacity="0.85"
                  />
                </motion.g>

                {/* Right Branch & Green Leaves */}
                <motion.g
                  initial={{ rotate: 15, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                >
                  <path
                    d="M178 134 C190 126 198 132 202 140 C194 142 184 139 178 134Z"
                    fill="#6E8261"
                  />
                  <path
                    d="M192 129 C200 123 205 126 208 132 C202 134 195 132 192 129Z"
                    fill="#566A4B"
                  />
                </motion.g>

                {/* Cozy Downy Nest Bed */}
                <ellipse cx="120" cy="128" rx="46" ry="15" fill="url(#nestBed)" />

                {/* Layered Woven Twigs & Rims (Warm Golden & Earthy Strokes) */}
                <path
                  d="M52 122 C64 146 176 146 188 122 C170 141 70 141 52 122Z"
                  fill="#C4922E"
                  opacity="0.9"
                />
                {/* Individual woven twig curves */}
                <path
                  d="M56 126 C75 146 165 146 184 126"
                  stroke="#A97B22"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  d="M65 130 C85 148 155 148 175 130"
                  stroke="#C4922E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M50 120 C70 137 170 137 190 120"
                  stroke="#D4A338"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M74 136 C92 149 148 149 166 136"
                  stroke="#E2775B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <path
                  d="M60 123 C80 132 160 132 180 123"
                  stroke="#566A4B"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </motion.g>

              {/* 4. The Graceful Returning Bird (Swooping Forward Flight & Landing) */}
              <motion.g
                initial={{
                  x: -125,
                  y: -75,
                  scale: 0.72,
                  rotate: 16,
                  opacity: 0,
                }}
                animate={{
                  x: [-125, -55, -14, 0],
                  y: [-75, -24, -5, 0],
                  scale: [0.72, 1.06, 1.02, 1],
                  rotate: [16, 8, -3, 0],
                  opacity: [0, 1, 1, 1],
                }}
                transition={{
                  duration: 1.35,
                  delay: 0.25,
                  times: [0, 0.55, 0.85, 1],
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <g transform="translate(100, 72)">
                  {/* Left (Back) Wing - Articulated Flapping */}
                  <motion.g
                    animate={{
                      rotate: [0, -32, 14, -25, 6, 0],
                    }}
                    transition={{
                      duration: 1.35,
                      delay: 0.25,
                      ease: "easeInOut",
                    }}
                    style={{ originX: "14px", originY: "18px" }}
                  >
                    <path
                      d="M12 18 C16 4 32 -6 40 -2 C34 9 24 18 12 18Z"
                      fill="#C85F45"
                    />
                    <path
                      d="M18 16 C23 6 34 -1 38 1 C32 10 25 17 18 16Z"
                      fill="#A64B32"
                      opacity="0.75"
                    />
                  </motion.g>

                  {/* Swallow Split Tail Feathers */}
                  <path
                    d="M4 30 C-6 36 -12 45 -9 48 C-3 44 4 37 8 32 Z"
                    fill="#C85F45"
                  />
                  <path
                    d="M8 32 C1 39 -3 47 0 50 C4 46 9 39 12 33 Z"
                    fill="#A64B32"
                  />

                  {/* Bird Torso & Aerodynamic Silhouette */}
                  <path
                    d="M10 20 C14 12 24 10 35 15 C43 19 48 28 42 36 C36 43 20 44 12 35 C8 30 8 24 10 20Z"
                    fill="url(#birdGrad)"
                  />

                  {/* Soft Peach Breast Down */}
                  <path
                    d="M26 23 C33 21 39 25 40 31 C36 36 28 34 24 28 C22 25 24 23 26 23Z"
                    fill="#FBE3DA"
                    opacity="0.85"
                  />

                  {/* Head & Alert Eye */}
                  <circle cx="38" cy="18" r="9" fill="#E2775B" />
                  <circle cx="40" cy="17" r="1.8" fill="#332C26" />
                  <circle cx="40.5" cy="16.5" r="0.6" fill="#FFFFFF" />

                  {/* Golden Beak */}
                  <path d="M46 17 L55 20 L46 22 Z" fill="#C4922E" />

                  {/* Fresh Green Olive Leaf Sprig Carried in Beak */}
                  <motion.g
                    initial={{ opacity: 1, rotate: 0 }}
                    animate={{
                      rotate: [0, 8, -4, 0],
                      y: [0, 0, 1, 3],
                    }}
                    transition={{
                      delay: 1.2,
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                    transform="translate(48, 19)"
                  >
                    {/* Tiny branch stem */}
                    <path d="M0 2 C6 3 14 0 18 -4" stroke="#6E8261" strokeWidth="1.2" fill="none" />
                    {/* Small blooming green leaves */}
                    <path d="M6 1 C9 -4 14 -3 15 2 C11 4 7 3 6 1Z" fill="#6E8261" />
                    <path d="M12 -1 C14 -6 19 -5 20 0 C16 2 13 1 12 -1Z" fill="#566A4B" />
                    {/* Golden nurture bud */}
                    <circle cx="18" cy="-4" r="2" fill="#C4922E" />
                  </motion.g>

                  {/* Right (Front) Wing - Graceful Feather Arcs */}
                  <motion.g
                    animate={{
                      rotate: [0, -42, 22, -32, 10, 0],
                    }}
                    transition={{
                      duration: 1.35,
                      delay: 0.25,
                      ease: "easeInOut",
                    }}
                    style={{ originX: "20px", originY: "24px" }}
                  >
                    <path
                      d="M18 24 C26 8 42 6 48 13 C40 24 30 31 18 24Z"
                      fill="url(#wingGrad)"
                    />
                    {/* Covert feather detail */}
                    <path
                      d="M24 23 C30 13 41 12 45 17 C38 24 31 29 24 23Z"
                      fill="#E2775B"
                      opacity="0.9"
                    />
                  </motion.g>
                </g>
              </motion.g>
            </svg>
          </div>

          {/* Typography & Brand Slogan Fade In */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-3"
          >
            <span className="block font-serif text-3xl font-bold tracking-tight text-[#332C26]">
              {siteConfig.brand.name}
            </span>
            <span className="block font-sans text-xs font-semibold uppercase tracking-widest text-[#6E8261] mt-1.5">
              {siteConfig.brand.tagline}
            </span>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="text-xs text-[#6E6259] font-serif italic mt-2"
            >
              {siteConfig.brand.motto}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
