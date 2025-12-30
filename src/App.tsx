import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import "./App.css";
import * as d3 from "d3";

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

  // 编程语言颜色映射
  const languageColors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#2b7489",
    Python: "#3572A5",
    Java: "#b07219",
    C: "#555555",
    "C++": "#f34b7d",
    "C#": "#178600",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#ffac45",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Scala: "#c22d40",
    R: "#198CE7",
  };

  // 获取GitHub热门仓库
  useEffect(() => {
    const fetchGitHubRepos = async () => {
      try {
        setLoading(true);

        // 使用GitHub API搜索热门仓库（使用stars排序，获取星标数最多的仓库）
        // 注意：GitHub API有速率限制，未认证请求每小时最多60次
        const response = await fetch(
          "https://api.github.com/search/repositories?q=stars:>20000+sort:stars&per_page=20",
          {
            headers: {
              Authorization: `Bearer`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();

        // 处理API响应，添加语言颜色
        const formattedRepos: GitHubRepo[] = data.items.map((item: any) => ({
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

        setRepos(formattedRepos);
      } catch (err) {
        console.error("Failed to fetch GitHub repos:", err);

        // 出错时使用简化的模拟数据
        const fallbackRepos: GitHubRepo[] = [
          {
            id: 1,
            name: "react",
            full_name: "facebook/react",
            description:
              "React.js - A JavaScript library for building user interfaces.",
            html_url: "https://github.com/facebook/react",
            stargazers_count: 224000,
            language: "JavaScript",
            language_color: languageColors.JavaScript,
          },
          {
            id: 2,
            name: "vue",
            full_name: "vuejs/vue",
            description: "Vue.js - The Progressive JavaScript Framework",
            html_url: "https://github.com/vuejs/vue",
            stargazers_count: 204000,
            language: "JavaScript",
            language_color: languageColors.JavaScript,
          },
          {
            id: 3,
            name: "typescript",
            full_name: "microsoft/TypeScript",
            description: "TypeScript - TypeScript is a superset of JavaScript",
            html_url: "https://github.com/microsoft/TypeScript",
            stargazers_count: 108000,
            language: "TypeScript",
            language_color: languageColors.TypeScript,
          },
        ];

        setRepos(fallbackRepos);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubRepos();
  }, []);

  if (loading) {
    return (
      <aside className="github-sidebar">
        <h2>GitHub热门仓库</h2>
        <div className="github-loading">加载中...</div>
      </aside>
    );
  }

  return (
    <aside className="github-sidebar">
      <h2>GitHub热门仓库</h2>
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
              <p className="github-repo-description">{repo.description}</p>
            )}
            <div className="github-repo-meta">
              <span className="github-repo-language">
                {repo.language && (
                  <>
                    <span
                      className="github-repo-language-color"
                      style={{ backgroundColor: repo.language_color }}
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
      </ul>
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

  const [compactMode, setCompactMode] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 假设你的书签数据
  const bookmarks: Bookmark[] = config?.bookmarks || [];

  const categories = [
    "all",
    ...Array.from(new Set(bookmarks.map((b) => b.category))),
  ];

  const filteredBookmarks = bookmarks.filter((b) => {
    // 分类过滤
    const categoryMatch =
      activeCategory === "all" || b.category === activeCategory;
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
              filteredBookmarks.map((b) => <BookmarkCard key={b.id} {...b} />)
            ) : (
              <div className="empty-state">该分类下暂无书签</div>
            )}
          </div>
        </div>
      </main>

      {/* GitHub仓库侧边栏 */}
      <GitHubRepoSidebar />
    </div>
  );
};

export default App;
