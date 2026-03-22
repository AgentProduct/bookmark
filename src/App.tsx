import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import "./App.css";
import * as d3 from "d3";
import googleIcon from "./assets/google-favicon.ico";
import youdaoIcon from "./assets/youdao-favicon.png";


// 声明全局config变量
declare const config: any;

// GitHub仓库接口
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  language_color?: string;
}

interface Bookmark {
  id: number;
  title: string;
  url: string;
  category: string;
  icon?: string;
  bgColor?: string;
  Mark?: boolean;
}

interface Wave {
  path: d3.Selection<SVGPathElement, unknown, null, undefined>;
  speed: number;
  amplitude: number;
  offset: number;
}

interface Particle {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  radius: number;
  color: string;
  opacity: number;
}

// 导入默认图标
import defaultFavicon from "./assets/default-favicon.svg";

// 获取分类图标
const getCategoryIcon = (category: string): string => {
  return config?.categoryIcons?.[category] || "📁";
};

/* GitHub仓库侧边栏组件 */
const GitHubRepoSidebar = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [mode, setMode] = useState<"hot" | "search">("hot");
  
  // 我们需要监听侧边栏的滚动，而不是仓库列表本身
  const sidebarRef = useRef<HTMLDivElement>(null);
  // 搜索防抖定时器ref
  const searchDebounceRef = useRef<number | null>(null);
  // 用于确保fetchHotRepos只执行一次的标志
  const hasFetchedHotRepos = useRef(false);

  const languageColors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#2b7489",
    Python: "#3572A5",
    Go: "#00ADD8",
    Rust: "#dea584",
    Java: "#b07219",
    HTML: "#e34c26",
    CSS: "#563d7c",
  };

  // 加载更多仓库的函数
  const loadMoreRepos = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      // 根据当前模式决定加载热门还是搜索结果
      if (mode === "hot") {
        const days = Math.floor(Math.random() * 365) + 30;
        const d = new Date();
        d.setDate(d.getDate() - days);
        const since = d.toISOString().split("T")[0];

        await fetchRepos(
          `https://api.github.com/search/repositories?q=created:>${since}+stars:>500&sort=stars&order=desc&per_page=20&page=${page + 1}`,
          true
        );
      } else {
        await fetchRepos(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(
            keyword
          )}&sort=stars&order=desc&per_page=20&page=${page + 1}`,
          true
        );
      }
      setPage((prev) => prev + 1);
    } catch (e) {
      console.error("加载更多仓库失败:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchRepos = async (url: string, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      }
      const res = await fetch(url, {
        // headers: {
        //   Authorization: `Bearer`,
        // },
      });
      if (!res.ok) throw new Error("GitHub API error");
      const data = await res.json();

      const list: GitHubRepo[] = data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        full_name: item.full_name,
        description: item.description,
        html_url: item.html_url,
        stargazers_count: item.stargazers_count,
        language: item.language,
        language_color: item.language
          ? languageColors[item.language]
          : undefined,
      }));

      // 如果是加载更多，则累积结果；否则重置结果
      if (isLoadMore) {
        setRepos((prev) => [...prev, ...list]);
        // 如果返回的结果少于请求的数量，说明没有更多数据了
        setHasMore(list.length === 20);
      } else {
        setRepos(list);
        setHasMore(list.length === 20);
        setPage(1);
      }
    } catch (e) {
      console.error(e);
      if (!isLoadMore) {
        setRepos([]);
      }
      setHasMore(false);
    } finally {
      if (!isLoadMore) {
        setLoading(false);
      }
    }
  };

  /* ====== 随机热门仓库（不重复的关键）====== */
  const fetchHotRepos = () => {
    // 重置页码和加载更多状态
    setPage(1);
    setHasMore(true);
    setRepos([]);
    
    const days = Math.floor(Math.random() * 365) + 30;
    const d = new Date();
    d.setDate(d.getDate() - days);
    const since = d.toISOString().split("T")[0];

    fetchRepos(
      `https://api.github.com/search/repositories?q=created:>${since}+stars:>500&sort=stars&order=desc&per_page=20`
    );
  };

  /* ====== 搜索 ====== */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    // 清除之前的定时器
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // 设置3秒防抖定时器
    searchDebounceRef.current = setTimeout(() => {
      setMode("search");
      // 重置页码和加载更多状态
      setPage(1);
      setHasMore(true);
      setRepos([]);
      
      fetchRepos(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(
          keyword
        )}&sort=stars&order=desc&per_page=20`
      );
    }, 300);
  };

  // 滚动监听，实现下拉加载更多
  useEffect(() => {
    if (!sidebarRef.current) return;

    const handleScroll = () => {
      if (loadingMore || !hasMore) return;

      const element = sidebarRef.current;
      if (!element) return;
      
      const { scrollTop, scrollHeight, clientHeight } = element;

      // 当滚动到底部附近（距离底部50px）时触发加载更多
      if (scrollHeight - scrollTop - clientHeight < 50) {
        loadMoreRepos();
      }
    };

    const element = sidebarRef.current;
    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [loadingMore, hasMore]);

  useEffect(() => {
    // 使用ref确保fetchHotRepos只执行一次，避免React StrictMode下的重复调用
    if (!hasFetchedHotRepos.current) {
      fetchHotRepos();
      hasFetchedHotRepos.current = true;
    }
    
    // 组件卸载时清除防抖定时器
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  return (
    <aside className="github-sidebar" ref={sidebarRef}>
      <h2>GitHub 仓库</h2>

      <form onSubmit={handleSearch} className="github-search">
        <input
          className="search-input"
          placeholder="搜索仓库..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </form>

      {mode === "search" && (
        <button
          className="github-back-btn"
          onClick={() => {
            setKeyword("");
            setMode("hot");
            fetchHotRepos();
          }}
        >
          ← 返回热门
        </button>
      )}

      {loading ? (
        <div className="github-loading">加载中...</div>
      ) : (
        <ul className="github-repo-list">
          {repos.map((repo) => (
            <li key={repo.id} className="github-repo-item">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="github-repo-title"
                title={repo.full_name}
              >
                {repo.full_name}
              </a>
              {repo.description && (
                <p className="github-repo-description">
                  {repo.description}
                </p>
              )}
              <div className="github-repo-meta">
                <span className="github-repo-language">
                  {repo.language && (
                    <>
                      <span
                        className="github-repo-language-color"
                        style={{ background: repo.language_color }}
                      />
                      {repo.language}
                    </>
                  )}
                </span>
                <span className="github-repo-stars">
                  {repo.stargazers_count.toLocaleString()}
                </span>
              </div>
            </li>
          ))}
          {/* 加载更多状态指示器 */}
          {loadingMore && (
            <li className="github-load-more">加载更多中...</li>
          )}
          {!hasMore && repos.length > 0 && (
            <li className="github-no-more">没有更多数据了</li>
          )}
        </ul>
      )}
    </aside>
  );
};

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
                // 当favicon不可用时使用默认图标
                const target = e.target as HTMLImageElement;
                // 防止无限循环：只有当当前src不是默认图标时才替换
                if (target.src !== defaultFavicon) {
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
        <span className="url-preview">{new URL(url).hostname}</span>
      </div>
    </article>
  );
});

/* 书签卡片（保持不变，只微调点击动画时长） */
const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const backgroundRef = useRef<SVGSVGElement>(null);
  const contentRef = useRef<HTMLDivElement>(null); // 添加内容区域ref

  const [compactMode, setCompactMode] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [baiduSearchTerm, setBaiduSearchTerm] = useState("");
  const [googleSearchTerm, setGoogleSearchTerm] = useState("");
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [activeTranslateTab, setActiveTranslateTab] = useState("baidu");
  const translateModalRef = useRef<HTMLDivElement>(null);
  const translateIconRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 处理百度搜索
  const handleBaiduSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (baiduSearchTerm.trim()) {
      const encodedQuery = encodeURIComponent(baiduSearchTerm);
      window.open(`https://www.baidu.com/s?wd=${encodedQuery}`, "_blank");
      setBaiduSearchTerm(""); // 清空搜索框
    }
  };

  // 处理Google搜索
  const handleGoogleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (googleSearchTerm.trim()) {
      const encodedQuery = encodeURIComponent(googleSearchTerm);
      window.open(`https://www.google.com/search?q=${encodedQuery}`, "_blank");
      setGoogleSearchTerm(""); // 清空搜索框
    }
  };

  // 假设你的书签数据
  const bookmarks: Bookmark[] = config?.bookmarks || [];

  const categories = [
    "all",
    'Mark',
    ...Array.from(new Set(bookmarks.map((b) => b.category))),
  ];

  const filteredBookmarks = bookmarks.filter((b) => {
    // 分类过滤
    const categoryMatch =
      activeCategory === "Mark" ? b.Mark === true : activeCategory === "all" || b.category === activeCategory;
    // 搜索过滤（忽略大小写的模糊搜索）
    const searchMatch =
      searchTerm === "" ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase());
    // 两者都匹配才返回true
    return categoryMatch && searchMatch;
  });

  // 处理搜索输入变化
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      // 搜索时也触发动画
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 100);
      return () => clearTimeout(timer);
    },
    []
  );

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    // 清除搜索时也触发动画
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // 翻译弹框显示/隐藏处理
  const toggleTranslateModal = () => {
    setShowTranslateModal(!showTranslateModal);
  };

  // 翻译弹框拖拽功能
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!translateModalRef.current) return;
    
    setIsDragging(true);
    const rect = translateModalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging || !translateModalRef.current) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // 确保弹框不会超出视口
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const modalWidth = translateModalRef.current.offsetWidth;
    const modalHeight = translateModalRef.current.offsetHeight;
    
    const finalX = Math.max(0, Math.min(newX, viewportWidth - modalWidth));
    const finalY = Math.max(0, Math.min(newY, viewportHeight - modalHeight));
    
    translateModalRef.current.style.left = `${finalX}px`;
    translateModalRef.current.style.top = `${finalY}px`;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 添加拖拽事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragOffset]);

  // 分类切换时触发网格动画
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 100); // 立即开始动画
    return () => clearTimeout(timer);
  }, [activeCategory]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 清除现有SVG内容
    d3.select(backgroundRef.current).selectAll("*").remove();
    const svg = d3
      .select(backgroundRef.current)
      .attr("width", width)
      .attr("height", height);

    // 创建波浪动画
    const waveCount = 3;
    const waves: Wave[] = [];

    const colors = ["#818cf8", "#4ade80", "#10b981"];
    const speeds = [0.005, 0.003, 0.007];
    const amplitudes = [20, 15, 25];

    // 添加粒子系统
    const particleCount = 120;
    const particles: Particle[] = [];
    const particleGroup = svg.append("g").attr("class", "particles");

    // 初始化粒子
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    // 创建粒子元素
    const particleElements = particleGroup
      .selectAll("circle")
      .data(particles)
      .enter()
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => d.color)
      .attr("opacity", (d) => d.opacity);

    // 创建波浪路径生成器
    const createWave = (index: number) => {
      const wave = svg
        .append("path")
        .attr("fill", "none")
        .attr("stroke", colors[index % colors.length])
        .attr("stroke-width", 2)
        .attr("opacity", 0.6);

      return {
        path: wave,
        speed: speeds[index % speeds.length],
        amplitude: amplitudes[index % amplitudes.length],
        offset: Math.random() * 1000,
      };
    };

    // 初始化波浪
    for (let i = 0; i < waveCount; i++) {
      waves.push(createWave(i));
    }

    // 波浪动画函数
    const animateWave = () => {
      waves.forEach((wave) => {
        wave.offset += wave.speed;
        const pathData = d3
          .line<[number, number]>()
          .x((d) => d[0])
          .y((d) => d[1])
          .curve(d3.curveBasis)(
          Array.from(
            { length: 100 },
            (_, i) =>
              [
                (i / 99) * width,
                100 + Math.sin(i / 10 + wave.offset) * wave.amplitude,
              ] as [number, number]
          )
        );

        wave.path.attr("d", pathData);
      });

      // 更新粒子位置
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // 边界检测
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });

      // 更新粒子元素
      particleElements.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      requestAnimationFrame(animateWave);
    };

    animateWave();

    // 监听内容区域尺寸变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect || {};
        svg.attr("width", width).attr("height", height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.unobserve(container);
    };
  }, []);

  return (
    <div className="app-container">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>书签分类</h2>
          <div
            className="user-avatar"
            onClick={() =>
              window.open("https://zhengjialux.github.io/", "_blank")
            }
          >
            <img
              src="https://avatars.githubusercontent.com/u/20078022?v=4"
              alt="用户头像"
            />
          </div>
        </div>

        <ul className="category-list">
          {categories.map((category) => {
            const count =
              category === "all"
                ? bookmarks.length
                : category === "Mark"
                ? bookmarks.filter((b) => b.Mark === true).length
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
      <main className="bookmark-content" ref={contentRef}>
        {/* D3粒子动画 */}
        <svg ref={backgroundRef} className="content-animation"></svg>
        <div className="content-container">
          <div className="content-header">
          <div className="header-left">
            <h1>
              {activeCategory === "all" ? "全部书签" : activeCategory} (
              {filteredBookmarks.length})
            </h1>
            <div className="search-boxes">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="搜索书签标题..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                  aria-label="搜索书签"
                />
                {searchTerm && (
                  <button
                    className="clear-search-btn"
                    onClick={clearSearch}
                    aria-label="清除搜索"
                  >
                    ×
                  </button>
                )}
              </div>
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
                <button
                  type="submit"
                  className="search-submit-btn"
                  aria-label="百度搜索"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </form>
              <form className="search-container google-search-container" onSubmit={handleGoogleSearch}>
                <img
                  src={googleIcon}
                  alt="Google图标"
                  className="google-icon-image"
                />
                <input
                  type="text"
                  placeholder="Google搜索..."
                  value={googleSearchTerm}
                  onChange={(e) => setGoogleSearchTerm(e.target.value)}
                  className="search-input"
                  aria-label="Google搜索"
                />
                <button
                  type="submit"
                  className="search-submit-btn"
                  aria-label="Google搜索"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </form>
              <button 
                className="translate-icon-btn"
                onClick={toggleTranslateModal}
                ref={translateIconRef}
                aria-label="打开翻译工具"
                title="打开翻译工具"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </button>
            </div>
          </div>

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
              filteredBookmarks.map((b, i) => <BookmarkCard key={i} {...b} />)
            ) : (
              <div className="empty-state">该分类下暂无书签</div>
            )}
          </div>
        </div>
      </main>

      {/* GitHub仓库侧边栏 */}
      <GitHubRepoSidebar />

      {/* 翻译弹框 */}
      {showTranslateModal && (
        <div className="translate-modal" ref={translateModalRef}>
          <div className="translate-modal-header" onMouseDown={handleDragStart}>
            <h3>翻译工具</h3>
            <button 
              className="translate-modal-close" 
              onClick={toggleTranslateModal}
              aria-label="关闭翻译工具"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="translate-modal-tabs">
            <button 
              className={`translate-modal-tab ${activeTranslateTab === "baidu" ? "active" : ""}`}
              onClick={() => setActiveTranslateTab("baidu")}
            >
              <img src="https://www.baidu.com/favicon.ico" alt="百度翻译" className="tab-icon" />
              百度翻译
            </button>
            <button 
              className={`translate-modal-tab ${activeTranslateTab === "youdao" ? "active" : ""}`}
              onClick={() => setActiveTranslateTab("youdao")}
            >
              <img src={youdaoIcon} alt="有道翻译" className="tab-icon" />
              有道翻译
            </button>
          </div>
          <div className="translate-modal-content">
            {activeTranslateTab === "youdao" && (
              <iframe 
                src="https://fanyi.youdao.com/#/AITranslate?keyfrom=fanyiweb_tab" 
                title="有道翻译"
                frameBorder="0"
              ></iframe>
            )}
            {activeTranslateTab === "baidu" && (
              <iframe 
                src="https://fanyi.baidu.com/" 
                title="百度翻译"
                frameBorder="0"
              ></iframe>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
