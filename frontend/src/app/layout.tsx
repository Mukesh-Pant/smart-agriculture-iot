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
    { name: "Sapana Pandey" },
    { name: "Mukesh Pant" },
    { name: "Adarsh Joshi" },
    { name: "Sagar Bist" },
  ],
  creator: "Sapana Pandey, Mukesh Pant, Adarsh Joshi, Sagar Bist — Computer Engineering, Far Western University",
  publisher: "Department of Computer Engineering, Far Western University",
  generator: "Next.js",
  keywords: [
    // Project / name
    "SmartAgri",
    "Smart Agriculture",
    "Smart Agri project",
    "IoT Smart Agriculture",
    "Smart Agriculture IoT Nepal",
    // University / programme
    "FWU Computer Engineering Major Project",
    "Far Western University Computer Engineering",
    "Far Western University Major Project",
    "Computer Engineering Major Project Nepal",
    "Bachelor of Computer Engineering project",
    "Far Western University Mahendranagar",
    // Authors
    "Sapana Pandey",
    "Mukesh Pant",
    "Adarsh Joshi",
    "Sagar Bist",
    "Smart Agriculture by Sapana Pandey Mukesh Pant Adarsh Joshi Sagar Bist",
    // Supervisors
    "Er. Birendra Singh Dhami",
    "Birendra Singh Dhami supervision project",
    "Er. Kamal Lekhak",
    "Kamal Lekhak supervision project",
    "project under Birendra Singh Dhami",
    "project under Kamal Lekhak",
    // Department mentors
    "Er. Toran Prasad Bhatt",
    "Er. Kishan Datta Bhatta",
    // Tech
    "ESP32 agriculture monitoring",
    "machine learning crop recommendation",
    "precision agriculture Nepal",
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
      "Major Project by Sapana Pandey, Mukesh Pant, Adarsh Joshi & Sagar Bist — Computer Engineering, Far Western University, Nepal. Under the supervision of Er. Birendra Singh Dhami and Er. Kamal Lekhak. ESP32 + MQTT + ML for crop, fertilizer, irrigation & soil recommendations.",
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
      "Major Project by Sapana Pandey, Mukesh Pant, Adarsh Joshi & Sagar Bist — Far Western University, Nepal. Supervised by Er. Birendra Singh Dhami & Er. Kamal Lekhak.",
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
  verification: {
    google: "R5me4xqsqffR5lxrgKqWetWnU_ftvySAzFOcV7cXBIg",
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
                  author: [
                    { "@type": "Person", name: "Sapana Pandey" },
                    { "@type": "Person", name: "Mukesh Pant" },
                    { "@type": "Person", name: "Adarsh Joshi" },
                    { "@type": "Person", name: "Sagar Bist" },
                  ],
                  contributor: [
                    {
                      "@type": "Person",
                      name: "Er. Birendra Singh Dhami",
                      jobTitle: "Project Supervisor",
                    },
                    {
                      "@type": "Person",
                      name: "Er. Kamal Lekhak",
                      jobTitle: "Project Supervisor",
                    },
                    {
                      "@type": "Person",
                      name: "Er. Toran Prasad Bhatt",
                      jobTitle: "Department of Computer Engineering",
                    },
                    {
                      "@type": "Person",
                      name: "Er. Kishan Datta Bhatta",
                      jobTitle: "Department of Computer Engineering",
                    },
                  ],
                  publisher: {
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
                  author: [
                    { "@type": "Person", name: "Sapana Pandey" },
                    { "@type": "Person", name: "Mukesh Pant" },
                    { "@type": "Person", name: "Adarsh Joshi" },
                    { "@type": "Person", name: "Sagar Bist" },
                  ],
                  contributor: [
                    { "@type": "Person", name: "Er. Birendra Singh Dhami" },
                    { "@type": "Person", name: "Er. Kamal Lekhak" },
                    { "@type": "Person", name: "Er. Toran Prasad Bhatt" },
                    { "@type": "Person", name: "Er. Kishan Datta Bhatta" },
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
