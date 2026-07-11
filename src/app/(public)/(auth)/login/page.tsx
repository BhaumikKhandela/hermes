"use client";

import Image from "next/image";
import { authClient } from "@/lib/auth/auth-client";

export default function LoginForm() {
  const handleLogin = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/projects",
      });
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F7FB] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            <Image
              src="/icons/logo-2.png"
              alt="Logo"
              width={60}
              height={60}
            />
          </div>

          <h1 className="text-[26px] font-bold text-[#111827]">Welcome back</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Sign in to continue to your dashboard
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#E7E7E7] bg-white px-4 py-3 text-sm font-medium text-[#111827] hover:bg-[#F5F5F5] transition hover:-translate-y-[2px] duration-200 ease-out"
          >
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width={20}
              height={20}
            />
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[#6B7280]">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
