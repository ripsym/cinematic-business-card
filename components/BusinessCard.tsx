"use client";

import { motion, AnimatePresence, type Transition } from "framer-motion";
import { useState, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

const ParticleScene = dynamic(
    () => import("./ParticleScene").then((m) => ({ default: m.ParticleScene })),
    { ssr: false }
);

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ===== Identity Reveal ===== */
function IdentityReveal({ onComplete }: { onComplete: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeOut" } }}
            transition={{ duration: 0.8, ease: EASE } as Transition}
            onAnimationComplete={() => {
                setTimeout(onComplete, 800);
            }}
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                pointerEvents: "none",
            }}
        >
            <h2
                style={{
                    fontSize: "clamp(15px, 3.8vw, 22px)",
                    fontWeight: 300,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.88)",
                    textShadow: "0 0 40px rgba(255,255,255,0.08)",
                }}
            >
                AI Media Architect
            </h2>
        </motion.div>
    );
}

/* ===== Contact Icon ===== */
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

/* ===== Card Phase ===== */
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
                transition={{ duration: 1.2, ease: EASE } as Transition}
                style={{
                    position: "relative",
                    width: "min(420px, 88vw)",
                    aspectRatio: "1075 / 650",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow:
                        "0 0 80px rgba(79, 140, 255, 0.06), 0 25px 60px rgba(0, 0, 0, 0.5)",
                }}
            >
                <div className="card-shimmer" />
                <Image
                    src="/card.png"
                    alt="Yoshinobu Matsubara - AI Media Architect"
                    fill
                    priority
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 88vw, 420px"
                />
            </motion.div>

            {/* Button */}
            <motion.button
                className="cta-button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, ease: EASE, delay: 1.2 } as Transition}
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
type Phase = "particles" | "identity" | "card";

export function BusinessCard() {
    const [phase, setPhase] = useState<Phase>("particles");

    const handleIdentityStart = useCallback(() => {
        setPhase("identity");
    }, []);

    const handleCardStart = useCallback(() => {
        setPhase("card");
    }, []);

    return (
        <>
            {/* WebGL Particle Background */}
            <ParticleScene
                onPhase={{
                    onIdentityStart: handleIdentityStart,
                    onCardStart: handleCardStart,
                }}
            />

            {/* DOM Overlays */}
            <AnimatePresence mode="wait">
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
