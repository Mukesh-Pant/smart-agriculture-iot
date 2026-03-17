"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Mail, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VerifyEmail() {
    const router = useRouter()
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Decorative elements */}
            {/* <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
            </div> */}

            <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border border-blue-100/50 dark:border-blue-900/50 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-col gap-4 items-center pt-8 pb-4">
                    {/* Animated mail icon */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur-xl opacity-60 animate-pulse" />
                        <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5 rounded-full w-fit mx-auto shadow-xl shadow-blue-500/30">
                            <Mail className="size-8" />
                        </div>
                    </div>

                    <div className="space-y-2 text-center">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            Check your email
                        </CardTitle>
                        <CardDescription className="text-base text-gray-500 dark:text-gray-400 max-w-sm">
                            We've sent a verification link to your email address. Please check your inbox.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 p-6 pt-2">
                    {/* Email tips card */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                    <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                                    Didn't receive the email?
                                </h4>
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    Check your spam folder or wait a few minutes. The link expires in 24 hours.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional info */}
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
                        <CheckCircle className="size-4 text-blue-500 flex-shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                            After verification, you'll be able to access your dashboard
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3 pt-2">
                        <Button 
                            onClick={() => router.back()} 
                            variant="outline" 
                            className="w-full h-11 rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                        >
                            <ArrowLeft className="size-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Login
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                            </div>
                            
                        </div>

                    </div>

                    
                    
                </CardContent>
            </Card>
        </div>
    )
}