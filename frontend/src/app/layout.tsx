import { Inter } from "next/font/google";
import "./globals.css";
import { TranslationProvider } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
                    {/* Sélecteur de langue en haut à droite */}
                    <div className="fixed top-4 right-4 z-50">
                        <LanguageSwitcher />
                    </div>
                    {children}
                </TranslationProvider>
            </body>
        </html>
    );
}