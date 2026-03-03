"use client";

import { motion, AnimatePresence, type Transition } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";

/* ===== Timing Constants ===== */
const T = {
    BLACK_SILENCE: 0.4,
    BG_AWAKENING: 0.4,
    HELLO_START: 1.2,
    HELLO_HOLD: 1.0,
    HELLO_FADE_OUT: 2.6,
    IDENTITY_START: 2.6,
    IDENTITY_HOLD: 0.8,
    IDENTITY_FADE_OUT: 3.6,
    CARD_START: 3.8,
    BUTTON_START: 5.0,
} as const;

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ===== Hello Letters ===== */
const HELLO_LETTERS = [
    { char: "H", color: "#4F8CFF" },
    { char: "e", color: "#9B5CF6" },
    { char: "l", color: "#3DDCFF" },
    { char: "l", color: "#FF5DA2" },
    { char: "o", color: "#FF9F40" },
    { char: ".", color: "rgba(255,255,255,0.7)" },
];

/* ===== Icons ===== */
function ContactIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
    );
}

/* ===== Phase Components ===== */

function HelloReveal({ onComplete }: { onComplete: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onComplete, (T.HELLO_FADE_OUT - T.HELLO_START) * 1000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeOut" } }}
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
            }}
        >
            <div style={{ position: "relative", display: "flex", gap: "2px" }}>
                <div className="hello-shimmer-container" />
                {HELLO_LETTERS.map((letter, i) => (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0, filter: "blur(12px)", scale: 0.96 }}
                        animate={{
                            opacity: 1,
                            filter: "blur(0px)",
                            scale: 1,
                        }}
                        transition={{
                            duration: 0.6,
                            ease: EASE,
                            delay: i * 0.08,
                        }}
                        style={{
                            fontSize: "clamp(48px, 12vw, 80px)",
                            fontWeight: 300,
                            color: letter.color,
                            letterSpacing: "0.02em",
                            lineHeight: 1,
                            textShadow:
                                letter.char === "."
                                    ? "0 0 20px rgba(255,255,255,0.3)"
                                    : "none",
                        }}
                    >
                        {letter.char}
                    </motion.span>
                ))}
            </div>
        </motion.div>
    );
}

function IdentityReveal({ onComplete }: { onComplete: () => void }) {
    useEffect(() => {
        const timer = setTimeout(
            onComplete,
            (T.IDENTITY_FADE_OUT - T.IDENTITY_START) * 1000
        );
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeOut" } }}
            transition={{ duration: 0.8, ease: EASE } as Transition}
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
            }}
        >
            <motion.h2
                style={{
                    fontSize: "clamp(16px, 4vw, 22px)",
                    fontWeight: 300,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.88)",
                    textShadow: "0 0 40px rgba(255,255,255,0.08)",
                }}
            >
                AI Media Architect
            </motion.h2>
        </motion.div>
    );
}

function CardPhase() {
    const [downloaded, setDownloaded] = useState(false);

    const handleAddContact = () => {
        const link = document.createElement("a");
        link.href = "/yoshinobu-matsubara.vcf";
        link.download = "yoshinobu-matsubara.vcf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "32px",
                zIndex: 10,
            }}
        >
            {/* Card */}
            <motion.div
                className="float-idle"
                initial={{ opacity: 0, y: 60, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={
                    {
                        duration: 1.2,
                        ease: EASE,
                    } as Transition
                }
                style={{
                    position: "relative",
                    width: "min(420px, 88vw)",
                    aspectRatio: "1075 / 650",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow:
                        "0 0 60px rgba(80, 100, 200, 0.06), 0 25px 60px rgba(0, 0, 0, 0.5)",
                }}
            >
                <div className="card-shimmer" />
                <Image
                    src="/card.png"
                    alt="Yoshinobu Matsubara - AI Media Architect"
                    fill
                    priority
                    quality={90}
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 88vw, 420px"
                />
            </motion.div>

            {/* Button */}
            <motion.button
                className="cta-button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={
                    {
                        duration: 0.8,
                        ease: EASE,
                        delay: T.BUTTON_START - T.CARD_START,
                    } as Transition
                }
                onClick={handleAddContact}
                whileTap={{ scale: 0.97 }}
                id="add-contact-button"
            >
                <ContactIcon />
                {downloaded ? "Added ✓" : "Add to Contacts"}
            </motion.button>
        </motion.div>
    );
}

/* ===== Main Orchestrator ===== */
type Phase = "black" | "hello" | "identity" | "card";

export function BusinessCard() {
    const [phase, setPhase] = useState<Phase>("black");
    const [bgVisible, setBgVisible] = useState(false);

    useEffect(() => {
        // Phase 2: Background awakening
        const bgTimer = setTimeout(() => setBgVisible(true), T.BG_AWAKENING * 1000);
        // Phase 3: Hello reveal
        const helloTimer = setTimeout(
            () => setPhase("hello"),
            T.HELLO_START * 1000
        );
        return () => {
            clearTimeout(bgTimer);
            clearTimeout(helloTimer);
        };
    }, []);

    return (
        <>
            {/* Cinematic gradient background */}
            <motion.div
                className="cinematic-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: bgVisible ? 1 : 0 }}
                transition={{ duration: 2.0, ease: "easeOut" } as Transition}
            />

            {/* Phase content */}
            <AnimatePresence mode="wait">
                {phase === "hello" && (
                    <HelloReveal
                        key="hello"
                        onComplete={() => setPhase("identity")}
                    />
                )}
                {phase === "identity" && (
                    <IdentityReveal
                        key="identity"
                        onComplete={() => setPhase("card")}
                    />
                )}
                {phase === "card" && <CardPhase key="card" />}
            </AnimatePresence>
        </>
    );
}
