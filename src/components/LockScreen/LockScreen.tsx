import { useState } from "react";
import lockBg from "../../assets/bg.webp";

interface LockScreenProps {
  // 解锁回调，返回是否解锁成功
  onUnlock: (password: string) => boolean;
}

/**
 * 锁屏界面：密码输入框 + 解锁按钮。
 * 锁定状态本身由父组件（useLock）管理，本组件只负责密码输入 UI 与错误提示。
 */
const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [lockPassword, setLockPassword] = useState("");
  const [lockError, setLockError] = useState(false);
  const [lockBgUrl] = useState(config?.lockBackground || lockBg);

  // 解锁
  const handleUnlock = () => {
    const ok = onUnlock(lockPassword);
    if (ok) {
      setLockPassword("");
      setLockError(false);
    } else {
      setLockError(true);
    }
  };

  return (
    <div className="lock-screen">
      <div className="lock-screen-bg-overlay" />
      <div
        className="lock-screen-bg"
        style={{ backgroundImage: `url(${lockBgUrl})` }}
      />
      <div className="lock-screen-content">
        <div className="lock-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2>书签已锁定</h2>
        <p className="lock-hint">输入密码解锁</p>
        <div className="lock-input-group">
          <input
            type="password"
            className={`lock-input ${lockError ? "error" : ""}`}
            placeholder="请输入密码"
            value={lockPassword}
            onChange={(e) => {
              setLockPassword(e.target.value);
              setLockError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            autoFocus
          />
          <button className="lock-unlock-btn" onClick={handleUnlock}>
            解锁
          </button>
        </div>
        {lockError && <p className="lock-error">密码错误，请重试</p>}
        <p className="lock-default-hint">默认密码: 1~6</p>
      </div>
    </div>
  );
};

export default LockScreen;
