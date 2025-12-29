import React, { useState, useEffect, useCallback, memo } from "react";
import "./App.css";

interface Bookmark {
  id: number;
  title: string;
  url: string;
  category: string;
  icon?: string;
  bgColor?: string;
}

// 获取分类图标
const getCategoryIcon = (category: string): string => {
  return config?.categoryIcons?.[category] || "📁";
};

/* 书签卡片（保持不变，只微调点击动画时长） */
const BookmarkCard = memo(function BookmarkCard({
  title,
  url,
  category,
  icon,
  bgColor,
}: Bookmark) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = useCallback(() => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150); // 稍微快一点，更灵敏
  }, []);

  return (
    <article className={`card ${isClicked ? "clicked" : ""}`}>
      <div className="card-header">
        <h3 className="bookmark-title">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="bookmark-link"
            onClick={handleClick}
          >
            <img
              className="bookmark-logo"
              style={{ backgroundColor: bgColor }}
              src={
                icon ||
                `https://www.google.com/s2/favicons?domain=${
                  new URL(url).hostname
                }&sz=32`
              }
              alt={`${title} logo`}
              loading="lazy"
              onError={(e) => {
                // 当favicon不可用时隐藏图片
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {title}
          </a>
        </h3>
      </div>

      <div className="card-body">
        <span className="category-tag">
          <span className="category-tag-icon">{getCategoryIcon(category)}</span>
          {category}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="visit-link"
          onClick={handleClick}
        >
          <span className="visit-icon">→</span> 访问链接
        </a>
      </div>

      <div className="card-footer">
        <span className="url-preview">{new URL(url).hostname}</span>
      </div>
    </article>
  );
});

function App() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [compactMode, setCompactMode] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // 假设你的书签数据
  const bookmarks: Bookmark[] = config?.bookmarks || [];

  const categories = [
    "all",
    ...Array.from(new Set(bookmarks.map((b) => b.category))),
  ];

  const filteredBookmarks =
    activeCategory === "all"
      ? bookmarks
      : bookmarks.filter((b) => b.category === activeCategory);

  // 分类切换时触发网格动画
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 100); // 立即开始动画
    return () => clearTimeout(timer);
  }, [activeCategory]);

  return (
    <div className="app-container">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>书签分类</h2>
        </div>

        <ul className="category-list">
          {categories.map((category) => {
            const count =
              category === "all"
                ? bookmarks.length
                : bookmarks.filter((b) => b.category === category).length;

            return (
              <li
                key={category}
                className={`category-item ${
                  activeCategory === category ? "active" : ""
                }`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="category-icon">
                  {getCategoryIcon(category)}
                </span>
                <span className="category-text">
                  {category === "all" ? "全部书签" : category}
                </span>
                <span className="category-count">({count})</span>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* 主内容区 */}
      <main className="bookmark-content">
        <div className="content-header">
          <h1>
            {activeCategory === "all" ? "全部书签" : activeCategory} (
            {filteredBookmarks.length})
          </h1>

          <button
            className={`compact-toggle ${compactMode ? "active" : ""}`}
            onClick={() => setCompactMode((v) => !v)}
            aria-label="切换紧凑/正常视图"
          >
            {compactMode ? "🌐" : "📋"}
          </button>
        </div>

        <div
          className={`bookmark-grid ${compactMode ? "compact" : ""} ${
            isAnimating ? "fade-in" : ""
          }`}
        >
          {filteredBookmarks.length > 0 ? (
            filteredBookmarks.map((b) => <BookmarkCard key={b.id} {...b} />)
          ) : (
            <div className="empty-state">该分类下暂无书签</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
