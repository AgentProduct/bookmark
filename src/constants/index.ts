// 声明全局config变量（运行时由 public/config.js 注入）
declare const config: any;

// GitHub 语言对应的颜色
export const languageColors: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#2b7489",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#563d7c",
};

// 获取分类图标，取不到则返回默认文件夹图标
export const getCategoryIcon = (category: string): string => {
  return config?.categoryIcons?.[category] || "📁";
};
