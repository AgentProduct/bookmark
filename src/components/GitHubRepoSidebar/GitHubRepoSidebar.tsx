import { useState, useEffect, useRef } from "react";
import type { GitHubRepo } from "../../types";
import { languageColors } from "../../constants";

/**
 * GitHub仓库侧边栏
 * - 支持热门仓库随机展示与关键字搜索
 * - 滚动到底部自动加载更多
 */
const GitHubRepoSidebar = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [mode, setMode] = useState<"hot" | "search">("hot");

  // 监听侧边栏滚动（而非仓库列表本身）
  const sidebarRef = useRef<HTMLDivElement>(null);
  // 搜索防抖定时器
  const searchDebounceRef = useRef<number | null>(null);
  // 确保 fetchHotRepos 只执行一次的标志（避免 React StrictMode 重复调用）
  const hasFetchedHotRepos = useRef(false);

  // 请求仓库数据
  const fetchRepos = async (url: string, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      }
      // 仅当配置了 githubToken 时才走认证请求，否则使用未认证请求
      // - 未认证：60 次/小时/每个 IP
      // - 认证：  5000 次/小时/每个用户
      const token = config?.githubToken;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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

      // 加载更多则累积，否则重置
      if (isLoadMore) {
        setRepos((prev) => [...prev, ...list]);
        // 返回结果少于请求数量，说明没有更多数据
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

  // 加载更多
  const loadMoreRepos = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
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
          `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}&sort=stars&order=desc&per_page=20&page=${page + 1}`,
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

  // 随机热门仓库
  const fetchHotRepos = () => {
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

  // 搜索（300ms 防抖）
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    // 清除之前的定时器
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setMode("search");
      setPage(1);
      setHasMore(true);
      setRepos([]);

      fetchRepos(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}&sort=stars&order=desc&per_page=20`
      );
    }, 300);
  };

  // 滚动到底部触发加载更多
  useEffect(() => {
    if (!sidebarRef.current) return;

    const handleScroll = () => {
      if (loadingMore || !hasMore) return;

      const element = sidebarRef.current;
      if (!element) return;

      const { scrollTop, scrollHeight, clientHeight } = element;

      // 距底部 50px 时触发
      if (scrollHeight - scrollTop - clientHeight < 50) {
        loadMoreRepos();
      }
    };

    const element = sidebarRef.current;
    element.addEventListener("scroll", handleScroll);

    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [loadingMore, hasMore]);

  // 初始化加载热门仓库，并在卸载时清除防抖定时器
  useEffect(() => {
    if (!hasFetchedHotRepos.current) {
      fetchHotRepos();
      hasFetchedHotRepos.current = true;
    }

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
                <p className="github-repo-description">{repo.description}</p>
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

export default GitHubRepoSidebar;
