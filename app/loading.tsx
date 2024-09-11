import { Loader2Icon } from "lucide-react";

export default function Loader({size, isWhite}:{size?: "small" | "medium", isWhite?: boolean}) {
    return (
        <div className="h-screen w-full flex items-center justify-center">

      <Loader2Icon
        className={`animate-spin transition-all duration-300 ${isWhite ? "text-white" : "text-primary"}
             ${
            size === "small" ? "h-8 w-8" : size === "medium" ? "h-12 w-12" : "h-16 w-16"
            }`}
            />
            </div>
    )
  }
