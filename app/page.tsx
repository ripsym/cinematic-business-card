import { BusinessCard } from "@/components/BusinessCard";

export default function Home() {
    return (
        <main
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Ambient glow background */}
            <div className="ambient-glow" />

            {/* Business card */}
            <BusinessCard />
        </main>
    );
}
