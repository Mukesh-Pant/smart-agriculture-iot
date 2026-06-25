import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smartagri.cloudcoesis.com"),
  title: {
    default:
      "SmartAgri — IoT Smart Agriculture | Major Project, Computer Engineering, Far Western University",
    template: "%s | SmartAgri — FWU Computer Engineering",
  },
  description:
    "SmartAgri is an IoT-based Smart Agriculture monitoring and decision-support system — the final-year Major Project of Bachelor of Computer Engineering students at Far Western University (FWU), Mahendranagar, Nepal. It combines ESP32 sensors, MQTT, machine learning (crop, fertilizer, irrigation, soil), and real-time analytics.",
  applicationName: "SmartAgri",
  authors: [
    { name: "Computer Engineering Students, Far Western University" },
  ],
  generator: "Next.js",
  keywords: [
    "Smart Agriculture",
    "SmartAgri",
    "Smart Agri project",
    "IoT Smart Agriculture",
    "Smart Agriculture IoT Nepal",
    "FWU Computer Engineering Major Project",
    "Far Western University Computer Engineering",
    "Computer Engineering Major Project",
    "Major Project Computer Engineering Nepal",
    "Smart Agriculture by Computer Engineering students",
    "Bachelor of Computer Engineering project",
    "ESP32 agriculture monitoring",
    "machine learning crop recommendation",
    "precision agriculture Nepal",
    "Far Western University Mahendranagar",
    "BE Computer final year project",
    "agriculture IoT machine learning",
  ],
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://smartagri.cloudcoesis.com",
    siteName: "SmartAgri",
    title:
      "SmartAgri — IoT Smart Agriculture | FWU Computer Engineering Major Project",
    description:
      "Final-year Major Project of Computer Engineering students at Far Western University, Nepal. ESP32 sensors + MQTT + ML for crop, fertilizer, irrigation & soil recommendations with real-time analytics.",
    locale: "en_US",
    images: [
      {
        url: "/landing/hero.jpg",
        width: 1200,
        height: 630,
        alt: "SmartAgri — IoT Smart Agriculture monitoring dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartAgri — IoT Smart Agriculture | FWU Computer Engineering",
    description:
      "Major Project by Computer Engineering students, Far Western University, Nepal. IoT + ML for precision farming.",
    images: ["/landing/hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Structured data — helps Google understand the project */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "SmartAgri",
                  alternateName: "Smart Agriculture IoT",
                  url: "https://smartagri.cloudcoesis.com",
                  description:
                    "IoT-based Smart Agriculture monitoring and decision-support system — Major Project of Computer Engineering students at Far Western University, Nepal.",
                },
                {
                  "@type": "SoftwareApplication",
                  name: "SmartAgri",
                  applicationCategory: "Agriculture IoT / Machine Learning",
                  operatingSystem: "Web",
                  url: "https://smartagri.cloudcoesis.com",
                  description:
                    "Smart Agriculture platform using ESP32 sensors, MQTT, and machine learning (crop, fertilizer, irrigation, soil fertility) with real-time analytics. Built as a Bachelor of Computer Engineering Major Project.",
                  author: {
                    "@type": "CollegeOrUniversity",
                    name: "Far Western University",
                    department: "Department of Computer Engineering",
                    address: {
                      "@type": "PostalAddress",
                      addressLocality: "Mahendranagar",
                      addressCountry: "Nepal",
                    },
                  },
                },
                {
                  "@type": "CreativeWork",
                  name: "SmartAgri — IoT Smart Agriculture Major Project",
                  about: [
                    "Smart Agriculture",
                    "Internet of Things",
                    "Machine Learning",
                    "Precision Agriculture",
                    "Computer Engineering Major Project",
                  ],
                  educationalLevel: "Bachelor of Computer Engineering",
                  publisher: {
                    "@type": "CollegeOrUniversity",
                    name: "Far Western University",
                  },
                  datePublished: "2025",
                },
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
