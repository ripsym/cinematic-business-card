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
                background: "#000000",
            }}
        >
            <BusinessCard />
        </main>
    );
}
