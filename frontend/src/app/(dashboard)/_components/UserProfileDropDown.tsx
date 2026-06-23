// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { auth } from "@/lib/auth";
// import getAvatarName from "@/lib/getAvatarName";
// import { ChevronDown } from "lucide-react";
// import { signOut } from "@/lib/auth";
// import UserProfilePage from "./Use";

// interface IUserProfileDropdown {
//     isFullName: boolean,
//     isArrowUp: boolean
// }

// export default async function UserProfileDropdownPage({ isArrowUp, isFullName }: IUserProfileDropdown) {
//     const session = await auth()
//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger>
//                 <div className="flex items-center gap-3 cursor-pointer">
//                     <Avatar className="border size-9 bg-neutral-900 cursor-pointer">
//                         <AvatarImage
//                             src={session?.user.image as string}
//                         />
//                         <AvatarFallback>
//                             {
//                                 getAvatarName(
//                                     session?.user.firstName as string,
//                                     session?.user.lastName as string
//                                 )
//                             }
//                         </AvatarFallback>
//                     </Avatar>
//                     {
//                         isFullName && (
//                             <div>
//                                 <p className="text-ellipsis line-clamp-1 font-medium">
//                                     <span>{session?.user.firstName}</span>
//                                     {" "}
//                                     <span>{session?.user.lastName}</span>
//                                 </p>
//                             </div>
//                         )
//                     }

//                     {
//                         isArrowUp && (
//                             <ChevronDown className="transition-all ml-auto" />
//                         )
//                     }
//                 </div>
//             </DropdownMenuTrigger>

//             <DropdownMenuContent className="w-full min-w-[250px]">
//                 <DropdownMenuLabel>
//                     My Account
//                 </DropdownMenuLabel>

//                 <DropdownMenuSeparator />
//                 {/* user Profile */}
//                 <UserProfilePage />

//                 <DropdownMenuItem onClick={async () => {
//                     "use server"
//                     await signOut()
//                 }}
//                     className="text-red-500 hover:bg-red-200 font-medium cursor-pointer">
//                     Logout
//                 </DropdownMenuItem>

//             </DropdownMenuContent>
//         </DropdownMenu>
//     )
// }

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { safeAuth } from "@/lib/safeAuth";
import getAvatarName from "@/lib/getAvatarName";
import {
  ChevronDown,
  ChevronUp,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import UserProfilePage from "./UserProfile";

interface IUserProfileDropdown {
    isFullName: boolean,
    isArrowUp: boolean
}

export default async function UserProfileDropdownPage({ isArrowUp, isFullName }: IUserProfileDropdown) {
    const session = await safeAuth()
    const userInitials = getAvatarName(
        session?.user.firstName as string,
        session?.user.lastName as string
    );
    const fullName = `${session?.user.firstName ?? ""} ${session?.user.lastName ?? ""}`.trim() || "User";
    const role = session?.user.user_role ?? "farmer";
    const isAdmin = role === "owner" || role === "admin";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all duration-300 group">
                    <div className="relative">
                        <Avatar className="relative size-10 border-2 border-white dark:border-slate-800 shadow-md">
                            <AvatarImage src={session?.user.image as string} className="object-cover" />
                            <AvatarFallback className="bg-[#2E8B57] text-white font-semibold">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                    </div>

                    {isFullName && (
                        <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#2E8B57] transition-colors line-clamp-1">
                                {fullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 capitalize">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {role}
                            </p>
                        </div>
                    )}

                    {isArrowUp && (
                        <div className="ml-auto">
                            <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-[#2E8B57] transition-all group-hover:-translate-y-0.5" />
                        </div>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-[280px] mt-2 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200 dark:border-slate-800 shadow-xl rounded-2xl"
                align="end"
                sideOffset={5}
            >
                {/* Header */}
                <div className="px-3 pt-3 pb-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-12 border-2 border-white shadow-md">
                            <AvatarImage src={session?.user.image as string} />
                            <AvatarFallback className="bg-[#2E8B57] text-white font-semibold">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                                {fullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {session?.user.email}
                            </p>
                        </div>
                    </div>
                </div>

                <DropdownMenuLabel className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 pt-3 pb-1">
                    My Account
                </DropdownMenuLabel>

                <div className="px-1">
                    <UserProfilePage />
                </div>

                <DropdownMenuSeparator className="bg-gray-100 dark:bg-slate-800 my-1" />

                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-all group">
                            <Settings className="w-4 h-4 text-gray-500 group-hover:text-[#2E8B57]" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
                        </Link>
                    </DropdownMenuItem>

                    {isAdmin && (
                        <DropdownMenuItem asChild>
                            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-all group">
                                <ShieldCheck className="w-4 h-4 text-gray-500 group-hover:text-[#2E8B57]" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin Panel</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-gray-100 dark:bg-slate-800 my-1" />

                <DropdownMenuItem
                    onClick={async () => {
                        "use server"
                        await signOut({ redirectTo: "/login" })
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer transition-all group mt-1"
                >
                    <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600 group-hover:translate-x-0.5 transition-transform" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">Logout</span>
                </DropdownMenuItem>

                <div className="px-3 py-2 mt-1">
                    <p className="text-[10px] text-center text-gray-400">
                        SmartAgri · Far Western University · 2025
                    </p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}