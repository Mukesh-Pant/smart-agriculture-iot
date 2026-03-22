import Logo from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <main className="relative h-screen overflow-hidden">
        {/* Enhanced linear background */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-linear-to-br from-green-50 via-white to-purple-50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200 via-transparent to-transparent opacity-60"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-green-200 via-transparent to-transparent opacity-40"></div>
        </div>

        {/* Floating elements for agriculture theme - using Tailwind classes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse [animation-delay:2s]"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse [animation-delay:4s]"></div>

        <header className="h-14 flex items-center backdrop-blur-md bg-white/30 px-4 sticky top-0 z-50 border-b border-gray-200/20">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <Logo />

            <Link
              href={"/login"}
              className={`${buttonVariants()} bg-linear-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              Get Started
            </Link>
          </div>
        </header>

        <div className="h-[calc(100vh-3.5rem)] flex flex-col">
          <div className="px-4 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-center flex-col gap-3 text-center -mt-10">
              <h1 className="text-3xl font-bold lg:text-5xl xl:text-6xl max-w-4xl bg-linear-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent">
                Smart Agriculture for a <br />
                Sustainable Future
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 max-w-2xl">
                We make it effortless so your crops flourish
              </p>
            </div>

            {/* Enhanced Image Section */}
            <div className="flex w-full items-center justify-center mt-6 px-4">
              <div className="relative group max-w-4xl w-full">
                {/* Image glow effect */}
                <div className="absolute -inset-1 bg-linear-to-r from-green-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

                {/* Image container */}
                <div className="relative overflow-hidden rounded-lg shadow-2xl">
                  <Image
                    src={"/dashboard.png"}
                    alt="Smart Agriculture Dashboard"
                    width={1000}
                    height={560}
                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                    priority
                    quality={100}
                    style={{
                      filter: "contrast(1.05) brightness(1.1)",
                    }}
                  />

                  {/* Overlay gradient for better brightness */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/5 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Feature Tags */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 px-4">
              {[
                { name: "Real-time Monitoring", icon: "🌱" },
                { name: "ML Crop Analysis", icon: "🤖" },
                { name: "Weather Forecasting & Analytics", icon: "☀️" },
                { name: "ML Advisor", icon: "📦" },
              ].map((feature) => (
                <span
                  key={feature.name}
                  className="px-4 py-2 bg-white border-2 border-green-200 rounded-full text-sm font-medium text-gray-700 shadow-sm hover:border-green-500 hover:bg-green-50 transition-all duration-300 flex items-center gap-2"
                >
                  <span>{feature.icon}</span>
                  {feature.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
