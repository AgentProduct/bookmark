import { useState, useRef, useCallback, useMemo } from "react";
import "./App.css";
import type { Bookmark } from "./types";
import { useLock } from "./hooks/useLock";
import LockScreen from "./components/LockScreen/LockScreen";
import CategorySidebar from "./components/CategorySidebar/CategorySidebar";
import SearchBarGroup from "./components/SearchBarGroup/SearchBarGroup";
import BookmarkGrid from "./components/BookmarkGrid/BookmarkGrid";
import GitHubRepoSidebar from "./components/GitHubRepoSidebar/GitHubRepoSidebar";
import BackgroundAnimation from "./components/BackgroundAnimation/BackgroundAnimation";
import TranslateModal from "./components/TranslateModal/TranslateModal";
import AIModal from "./components/AIModal/AIModal";

/**
 * 书签导航主应用
 * 仅负责布局编排与顶层状态串联，具体 UI 由各子组件实现
 */
const App: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  // 分类与搜索状态
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [compactMode, setCompactMode] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 弹框显隐
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // 锁屏状态
  const { isLocked, lock, unlock } = useLock();

  // 书签数据（运行时配置注入）
  // 为每条书签补上稳定 id（取完整列表的位置索引），保证分类过滤/搜索后 key 稳定不变
  const bookmarks: Bookmark[] = useMemo(
    () =>
      (config?.bookmarks || []).map(
        (b: Bookmark, i: number) => ({ ...b, id: b.id ?? i })
      ),
    []
  );

  // 分类列表：全部 + 标星 + 实际分类去重
  const categories = [
    "all",
    "Mark",
    ...Array.from(new Set(bookmarks.map((b) => b.category))),
  ];

  // 按分类 + 搜索关键字过滤
  const filteredBookmarks = bookmarks.filter((b) => {
    const categoryMatch =
      activeCategory === "Mark"
        ? b.Mark === true
        : activeCategory === "all" || b.category === activeCategory;
    const searchMatch =
      searchTerm === "" ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // 动画定时器复用同一个 ref，避免快速输入/切换时堆积多个 setTimeout
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 触发网格淡入动画
  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    if (animationTimer.current) clearTimeout(animationTimer.current);
    animationTimer.current = setTimeout(() => setIsAnimating(false), 100);
  }, []);

  // 书签搜索输入变化
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      triggerAnimation();
    },
    [triggerAnimation]
  );

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    triggerAnimation();
  }, [triggerAnimation]);

  // 分类切换：更新激活分类并同步触发网格淡入动画
  // 直接在事件回调里触发，避免在 effect 中同步 setState（react-hooks/set-state-in-effect）
  const handleSelectCategory = useCallback(
    (category: string) => {
      setActiveCategory(category);
      triggerAnimation();
    },
    [triggerAnimation]
  );

  return (
    <>
      {/* 锁屏界面 */}
      {isLocked && <LockScreen onUnlock={unlock} />}

      <div className="app-container">
        {/* 左侧分类侧边栏 */}
        <CategorySidebar
          bookmarks={bookmarks}
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          onLock={lock}
        />

        {/* 主内容区 */}
        <main className="bookmark-content" ref={contentRef}>
          {/* D3 粒子动画背景 */}
          <BackgroundAnimation contentRef={contentRef} />

          <div className="content-container">
            <SearchBarGroup
              title={activeCategory === "all" ? "全部书签" : activeCategory}
              filteredCount={filteredBookmarks.length}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onClearSearch={clearSearch}
              compactMode={compactMode}
              onToggleCompact={() => setCompactMode((v) => !v)}
              onToggleTranslate={() => setShowTranslateModal((v) => !v)}
              onToggleAI={() => setShowAIModal((v) => !v)}
            />

            <BookmarkGrid
              bookmarks={filteredBookmarks}
              compactMode={compactMode}
              isAnimating={isAnimating}
            />
          </div>
        </main>

        {/* GitHub 仓库侧边栏 */}
        <GitHubRepoSidebar />

        {/* 翻译工具弹框 */}
        <TranslateModal
          visible={showTranslateModal}
          onClose={() => setShowTranslateModal(false)}
        />

        {/* AI 助手弹框 */}
        <AIModal
          visible={showAIModal}
          onClose={() => setShowAIModal(false)}
        />
      </div>
    </>
  );
};

export default App;
