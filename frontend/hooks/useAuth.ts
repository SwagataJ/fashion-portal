"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export const useAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    } else {
      setAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  return { isLoading, authenticated };
};
