"use client"
import { Button } from "./ui/button";
import { useFormStatus } from "react-dom";

export default function SubmitButton({title}: {title: string}){
   const { pending } = useFormStatus()

   return(
    <Button>
        {
            pending ? "loading..." : title
        }
    </Button>
   )
}