"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import type { ExternalToast } from "sonner";

export function usePushNotifications() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") return;

    if (Notification.permission === "denied") return;

    const timer = setTimeout(() => {
      Notification.requestPermission().catch(() => {});
    }, 5000);

    return () => clearTimeout(timer);
  }, []);
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      ...options,
    });
  }
}

export function scheduleStudyReminder(time: string, daysOfWeek: string[]) {
  const today = new Date().getDay().toString();
  if (!daysOfWeek.includes(today)) return null;

  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  const delay = target.getTime() - now.getTime();
  if (delay <= 0) return null;

  return setTimeout(() => {
    sendLocalNotification("📚 学习时间到！", {
      body: "打开四级英语，开始今天的学习吧！",
      tag: "study-reminder",
      requireInteraction: true,
    });
  }, delay);
}

export function notifyAchievement(name: string, description: string) {
  toast.success(`🎉 成就解锁: ${name}`, {
    description,
    duration: 4000,
  });
}

export const notification = {
  success(message: string, description?: string, options?: ExternalToast) {
    toast.success(message, {
      description,
      duration: 3000,
      ...options,
    });
  },

  error(message: string, description?: string, options?: ExternalToast) {
    toast.error(message, {
      description: description ?? "请稍后重试，如果问题持续存在请联系我们",
      duration: 5000,
      ...options,
    });
  },

  warning(message: string, description?: string, options?: ExternalToast) {
    toast.warning(message, {
      description,
      duration: 4000,
      ...options,
    });
  },

  info(message: string, description?: string, options?: ExternalToast) {
    toast.info(message, {
      description,
      duration: 3000,
      ...options,
    });
  },

  loading(message: string, description?: string, options?: ExternalToast) {
    return toast.loading(message, {
      description,
      ...options,
    });
  },

  dismiss(toastId?: string) {
    toast.dismiss(toastId);
  },

  apiError(error: unknown, fallbackMessage?: string) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "error" in error
          ? String((error as Record<string, unknown>).error)
          : (fallbackMessage ?? "请求失败，请检查网络连接");

    toast.error(message, {
      description: "请稍后重试",
      duration: 5000,
    });
  },

  aiError(error: unknown) {
    const message = error instanceof Error ? error.message : "AI 服务暂时不可用，请稍后再试";

    toast.error(message, {
      description: "AI 请求失败，系统将在稍后自动恢复",
      duration: 6000,
    });
  },

  networkError() {
    toast.error("网络连接失败", {
      description: "请检查您的网络连接后重试",
      duration: 6000,
    });
  },
};
