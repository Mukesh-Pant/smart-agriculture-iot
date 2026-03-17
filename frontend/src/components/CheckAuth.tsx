// component for protected page like dashboard

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// dashboard
export async function ProtectedPage(){
    const session = await auth()

    if(!session){
        redirect("/login")
    }

    return(
        <></>
    )
}

// component for unprotected page
// login
// landing page
export async function UnprotectedPage() {
    const session = await auth()

    if(session){

       if(!session.user.firstName || !session.user.lastName || !session.user.device_id || !session.user.user_role) {
         redirect('/onboarding')
       }
       
       redirect('/jwtSetup')
    }

    return <></>
    
}