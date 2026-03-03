"use client";

import { motion, type Transition } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const cardTransition: Transition = {
    duration: 1.2,
    ease: EASE,
    delay: 0.4,
};

const buttonTransition: Transition = {
    duration: 0.8,
    ease: EASE,
    delay: 1.3,
};

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

export function BusinessCard() {
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
        <div
            style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "32px",
            }}
        >
            {/* Card Image */}
            <motion.div
                className="float-idle"
                initial={{ opacity: 0, scale: 0.92, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={cardTransition}
                style={{
                    position: "relative",
                    width: "min(420px, 90vw)",
                    aspectRatio: "1075 / 650",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow:
                        "0 0 80px rgba(255, 255, 255, 0.03), 0 25px 60px rgba(0, 0, 0, 0.6)",
                }}
            >
                {/* Shimmer overlay */}
                <div className="card-shimmer" />

                <Image
                    src="/card.png"
                    alt="Yoshinobu Matsubara - AI Media Architect"
                    fill
                    priority
                    quality={90}
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 90vw, 420px"
                />
            </motion.div>

            {/* CTA Button */}
            <motion.button
                className="cta-button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={buttonTransition}
                onClick={handleAddContact}
                whileTap={{ scale: 0.97 }}
                id="add-contact-button"
            >
                <ContactIcon />
                {downloaded ? "Added ✓" : "Add to Contacts"}
            </motion.button>
        </div>
    );
}
