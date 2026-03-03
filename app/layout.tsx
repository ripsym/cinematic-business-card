import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
    weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
    title: "Yoshinobu Matsubara | AI Media Architect",
    description:
        "Digital business card — AI Media Architect specializing in next-generation media production.",
    openGraph: {
        title: "Yoshinobu Matsubara | AI Media Architect",
        description:
            "Digital business card — AI Media Architect specializing in next-generation media production.",
        type: "website",
        locale: "ja_JP",
    },
    robots: "noindex, nofollow",
    icons: {
        icon: "/favicon.svg",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja" className={outfit.variable}>
            <body>{children}</body>
        </html>
    );
}
