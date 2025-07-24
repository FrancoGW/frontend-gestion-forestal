"use client";
import { useFrontendVersion } from "@/hooks/useFrontendVersion";

export function FrontendVersionEffect() {
  useFrontendVersion();
  return null;
} 