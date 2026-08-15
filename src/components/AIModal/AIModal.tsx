import { useRef, useState } from "react";
import chatgptIcon from "/public/icons/chatgpt-eex17e9e.ico";
import grokIcon from "/public/icons/grok-favicon-light.png";
import geminiIcon from "/public/icons/gemini-favicon.svg";
import { useDraggable } from "../../hooks/useDraggable";

interface AIModalProps {
  visible: boolean;
  onClose: () => void;
}

// AI 渠道：内嵌 iframe 的有 doubao/kimi/yuanbao，其余点击跳转新页
const AI_TABS = [
  { key: "doubao", label: "豆包", icon: "https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/chat/favicon.png", iframe: "https://www.doubao.com/chat/" },
  { key: "kimi", label: "Kimi", icon: "https://kimi.moonshot.cn/favicon.ico", iframe: "https://kimi.moonshot.cn/" },
  { key: "yuanbao", label: "元宝", icon: "https://static.yuanbao.tencent.com/m/yuanbao-web/favicon_new@32.png", iframe: "https://yuanbao.tencent.com/chat/" },
  { key: "qwen", label: "千问", icon: "https://g.alicdn.com/qwenweb/qwen-ai-fe/0.0.4/favicon.ico", external: "https://www.qianwen.com/" },
  { key: "deepseek", label: "DeepSeek", icon: "https://www.deepseek.com/favicon.ico", external: "https://chat.deepseek.com/" },
  { key: "grok", label: "Grok", icon: grokIcon, external: "https://grok.com/" },
  { key: "chatgpt", label: "ChatGPT", icon: chatgptIcon, external: "https://chatgpt.com/" },
  { key: "gemini", label: "Gemini", icon: geminiIcon, external: "https://gemini.google.com/app" },
] as const;

/**
 * AI 助手弹框：可拖拽，部分渠道内嵌 iframe，部分跳转新页
 */
const AIModal = ({ visible, onClose }: AIModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { onDragStart } = useDraggable(modalRef, {
    centerOnMount: true,
    visible,
  });
  const [activeTab, setActiveTab] = useState<string>("doubao");

  if (!visible) return null;

  // 当前选中的可内嵌渠道
  const activeIframe = AI_TABS.find(
    (t) => t.key === activeTab && "iframe" in t
  ) as { key: string; label: string; iframe: string } | undefined;

  return (
    <div className="translate-modal ai-modal" ref={modalRef}>
      <div className="translate-modal-header" onMouseDown={onDragStart}>
        <h3>AI助手</h3>
        <button
          className="translate-modal-close"
          onClick={onClose}
          aria-label="关闭AI助手"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="translate-modal-tabs">
        {AI_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`translate-modal-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() =>
              "external" in tab && tab.external
                ? window.open(tab.external)
                : setActiveTab(tab.key)
            }
          >
            <img src={tab.icon} alt={tab.label} className="tab-icon" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="translate-modal-content">
        {activeIframe && (
          <iframe src={activeIframe.iframe} title={`${activeIframe.label} AI`} frameBorder="0"></iframe>
        )}
      </div>
    </div>
  );
};

export default AIModal;
