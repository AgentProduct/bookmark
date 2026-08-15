import { useState } from "react";
import googleIcon from "../../assets/google-favicon.ico";

interface SearchBarGroupProps {
  title: string;
  filteredCount: number;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  compactMode: boolean;
  onToggleCompact: () => void;
  onToggleTranslate: () => void;
  onToggleAI: () => void;
}

/**
 * 顶部搜索栏组
 * - 书签标题搜索（受控，状态由父组件管理）
 * - 百度 / Google 搜索（独立新页跳转，状态自管理）
 * - 翻译 / AI 工具入口按钮
 * - 紧凑视图切换
 */
const SearchBarGroup = ({
  title,
  filteredCount,
  searchTerm,
  onSearchChange,
  onClearSearch,
  compactMode,
  onToggleCompact,
  onToggleTranslate,
  onToggleAI,
}: SearchBarGroupProps) => {
  // 百度 / Google 搜索框状态自管理
  const [baiduSearchTerm, setBaiduSearchTerm] = useState("");
  const [googleSearchTerm, setGoogleSearchTerm] = useState("");

  const handleBaiduSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (baiduSearchTerm.trim()) {
      const encodedQuery = encodeURIComponent(baiduSearchTerm);
      window.open(`https://www.baidu.com/s?wd=${encodedQuery}`, "_blank");
      setBaiduSearchTerm(""); // 清空搜索框
    }
  };

  const handleGoogleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (googleSearchTerm.trim()) {
      const encodedQuery = encodeURIComponent(googleSearchTerm);
      window.open(`https://www.google.com/search?q=${encodedQuery}`, "_blank");
      setGoogleSearchTerm(""); // 清空搜索框
    }
  };

  return (
    <div className="content-header">
      <div className="header-left">
        <h1>
          {title} ({filteredCount})
        </h1>
        <div className="search-boxes">
          {/* 书签标题搜索 */}
          <div className="search-container">
            <input
              type="text"
              placeholder="搜索书签标题..."
              value={searchTerm}
              onChange={onSearchChange}
              className="search-input"
              aria-label="搜索书签"
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={onClearSearch}
                aria-label="清除搜索"
              >
                ×
              </button>
            )}
          </div>

          {/* 百度搜索 */}
          <form className="search-container baidu-search-container" onSubmit={handleBaiduSearch}>
            <img
              src="https://www.baidu.com/favicon.ico"
              alt="百度图标"
              className="baidu-icon-image"
            />
            <input
              type="text"
              placeholder="百度搜索..."
              value={baiduSearchTerm}
              onChange={(e) => setBaiduSearchTerm(e.target.value)}
              className="search-input"
              aria-label="百度搜索"
            />
            <button type="submit" className="search-submit-btn" aria-label="百度搜索">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>

          {/* Google 搜索 */}
          <form className="search-container google-search-container" onSubmit={handleGoogleSearch}>
            <img src={googleIcon} alt="Google图标" className="google-icon-image" />
            <input
              type="text"
              placeholder="Google搜索..."
              value={googleSearchTerm}
              onChange={(e) => setGoogleSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Google搜索"
            />
            <button type="submit" className="search-submit-btn" aria-label="Google搜索">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>

          {/* 翻译工具入口 */}
          <button
            className="translate-icon-btn"
            onClick={onToggleTranslate}
            aria-label="打开翻译工具"
            title="打开翻译工具"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </button>

          {/* AI 工具入口 */}
          <button
            className="translate-icon-btn ai-icon-btn"
            onClick={onToggleAI}
            aria-label="打开AI工具"
            title="打开AI工具"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8"></path>
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
              <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h8M8 18h5"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* 紧凑视图切换 */}
      <button
        className={`compact-toggle ${compactMode ? "active" : ""}`}
        onClick={onToggleCompact}
        aria-label="切换紧凑/正常视图"
      >
        {compactMode ? "🌐" : "📋"}
      </button>
    </div>
  );
};

export default SearchBarGroup;
