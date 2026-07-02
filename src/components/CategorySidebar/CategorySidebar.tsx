import type { Bookmark } from "../../types";
import { getCategoryIcon } from "../../constants";

interface CategorySidebarProps {
  bookmarks: Bookmark[];
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onLock: () => void;
}

/**
 * 左侧分类侧边栏：分类列表 + 用户头像 + 锁定按钮
 */
const CategorySidebar = ({
  bookmarks,
  categories,
  activeCategory,
  onSelectCategory,
  onLock,
}: CategorySidebarProps) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>书签分类</h2>
        <div
          className="user-avatar"
          onClick={() => window.open("https://zhengjialux.github.io/", "_blank")}
        >
          <img
            src="https://avatars.githubusercontent.com/u/20078022?v=4"
            alt="用户头像"
          />
        </div>
        <button className="lock-btn" onClick={onLock} title="锁定书签">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
          </svg>
        </button>
      </div>

      <ul className="category-list">
        {categories.map((category) => {
          // 计算每个分类的书签数量
          const count =
            category === "all"
              ? bookmarks.length
              : category === "Mark"
                ? bookmarks.filter((b) => b.Mark === true).length
                : bookmarks.filter((b) => b.category === category).length;

          return (
            <li
              key={category}
              className={`category-item ${activeCategory === category ? "active" : ""}`}
              onClick={() => onSelectCategory(category)}
            >
              <span className="category-icon">{getCategoryIcon(category)}</span>
              <span className="category-text">
                {category === "all" ? "全部书签" : category}
              </span>
              <span className="category-count">({count})</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default CategorySidebar;
