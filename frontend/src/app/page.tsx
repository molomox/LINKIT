"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import "./globals.css";

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/auth/signup");
    }, [router]);

    return null;
}

