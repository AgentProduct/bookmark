import { memo, useState, useCallback } from "react";
import type { Bookmark } from "../../types";
import { getCategoryIcon } from "../../constants";
import defaultFavicon from "../../assets/default-favicon.svg";

/**
 * 单个书签卡片，使用 memo 避免列表重渲染
 */
const BookmarkCard = memo(function BookmarkCard({
  title,
  url,
  category,
  icon,
  bgColor,
}: Bookmark) {
  const [isClicked, setIsClicked] = useState(false);

  // 安全解析 hostname，解析失败时回退为 url 原文，避免一条非法 url 导致整个网格渲染崩溃
  const hostname = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  // 点击反馈动画
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
                `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
              }
              alt={`${title} logo`}
              loading="lazy"
              onError={(e) => {
                // favicon 不可用时回退默认图标；用 dataset 标记避免重复触发造成无限循环
                const target = e.target as HTMLImageElement;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = "true";
                  target.src = defaultFavicon;
                  target.style.display = "block";
                }
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
        <span className="url-preview">{hostname}</span>
      </div>
    </article>
  );
});

export default BookmarkCard;
