"use client";

import { authClient } from "@/lib/auth/auth-client";
import Image from "next/image";
import { AuthButton } from "../accounts/AuthButton";

const TopNav = () => {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) {
    return <div className="p-2 text-sm">Loading ...</div>;
  }

  return (
    <nav className="flex items-center justify-between px-4 py-2 border-b bg-white sm:px-6">
      <div className="flex items-center">
        <div className="-ml-2.5">
          <Image
            src="/icons/logo-2.png"
            alt="logo"
            width={60}
            height={20}
            className="h-12 w-auto"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex gap-2 hover:bg-muted p-2 rounded-md cursor-pointer">
          <AuthButton session={session} />
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
