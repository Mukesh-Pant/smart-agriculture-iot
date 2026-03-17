import { UnprotectedPage } from "@/components/CheckAuth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex justify-center items-center flex-col min-h-dvh h-dvh overflow-auto relative ">
            <div className="absolute top-0 -z-10 h-full w-full bg-white">
               <div className="absolute bottom-auto left-auto right-0 top-0 h-500px w-500px -translate-x-[30%] translate-y-[20%] rounded-full bg-[rgba(173,109,244,0.5)] opacity-30 blur-[80px]">
               </div>
            </div>
            <div className="z-10 relative">
                {children}
            </div>
            <UnprotectedPage/>
        </main>
    )
}