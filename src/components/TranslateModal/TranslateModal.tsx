import { useRef, useState } from "react";
import googleIcon from "../../assets/google-favicon.ico";
import youdaoIcon from "../../assets/youdao-favicon.png";
import { useDraggable } from "../../hooks/useDraggable";

interface TranslateModalProps {
  visible: boolean;
  onClose: () => void;
}

// 翻译渠道：百度 / 有道 内嵌 iframe，谷歌直接跳转
const TRANSLATE_TABS = [
  { key: "baidu", label: "百度翻译", icon: "https://www.baidu.com/favicon.ico", url: "https://fanyi.baidu.com/" },
  { key: "youdao", label: "有道翻译", icon: youdaoIcon, url: "https://fanyi.youdao.com/#/AITranslate?keyfrom=fanyiweb_tab" },
  { key: "google", label: "谷歌翻译", icon: googleIcon, external: "https://translate.google.com.hk/" },
] as const;

/**
 * 翻译工具弹框：可拖拽，百度/有道内嵌 iframe，谷歌跳转新页
 */
const TranslateModal = ({ visible, onClose }: TranslateModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { onDragStart } = useDraggable(modalRef, {
    centerOnMount: true,
    visible,
  });
  const [activeTab, setActiveTab] = useState<string>("baidu");

  if (!visible) return null;

  return (
    <div className="translate-modal" ref={modalRef}>
      <div className="translate-modal-header" onMouseDown={onDragStart}>
        <h3>翻译工具</h3>
        <button
          className="translate-modal-close"
          onClick={onClose}
          aria-label="关闭翻译工具"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="translate-modal-tabs">
        {TRANSLATE_TABS.map((tab) => (
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
        {activeTab === "youdao" && (
          <iframe src="https://fanyi.youdao.com/#/AITranslate?keyfrom=fanyiweb_tab" title="有道翻译" frameBorder="0"></iframe>
        )}
        {activeTab === "baidu" && (
          <iframe src="https://fanyi.baidu.com/" title="百度翻译" frameBorder="0"></iframe>
        )}
      </div>
    </div>
  );
};

export default TranslateModal;
