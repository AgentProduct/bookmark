import { useState, useCallback } from "react";

/**
 * 锁屏状态管理
 * - 初始值从 localStorage 读取（默认锁定）
 * - lock()/unlock() 同步写回 localStorage
 */
export const useLock = () => {
  const [isLocked, setIsLocked] = useState(() => {
    const stored = localStorage.getItem("app_locked");
    return stored === null || stored === "true";
  });

  // 解锁
  const unlock = useCallback((password: string): boolean => {
    const storedPassword = localStorage.getItem("app_password") || "123456";
    if (password === storedPassword) {
      setIsLocked(false);
      localStorage.setItem("app_locked", "false");
      return true;
    }
    return false;
  }, []);

  // 锁定
  const lock = useCallback(() => {
    setIsLocked(true);
    localStorage.setItem("app_locked", "true");
  }, []);

  return { isLocked, lock, unlock };
};
