"use client"

import { useRouter } from "next/navigation";
import BackendApi from "../_components/Common";
import { useEffect } from "react";

export default function JwtSetupPage() {
  const router = useRouter();

  const fetchData = async () => {
    try {
      const response = await fetch(BackendApi.SettingCookies.url, {
        method: BackendApi.SettingCookies.method,
        credentials: "include",
      });

      const dataResponse = await response.json();
      console.log("setting_Cookies Response", dataResponse);

      if (response.status === 200) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error setting cookies:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return null
}