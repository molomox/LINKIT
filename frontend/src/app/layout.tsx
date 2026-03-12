import { Inter } from "next/font/google";
import "./globals.css";
import { TranslationProvider } from "@/i18n";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body className={inter.className}>
                <TranslationProvider>
                    {children}
                </TranslationProvider>
            </body>
        </html>
    );
}