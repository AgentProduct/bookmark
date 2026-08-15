import type * as d3 from "d3";

// GitHub仓库接口
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  language_color?: string;
}

// 书签接口
export interface Bookmark {
  id: number;
  title: string;
  url: string;
  category: string;
  icon?: string;
  bgColor?: string;
  Mark?: boolean;
}

// 背景动画 - 波浪
export interface Wave {
  path: d3.Selection<SVGPathElement, unknown, null, undefined>;
  speed: number;
  amplitude: number;
  offset: number;
}

// 背景动画 - 粒子
export interface Particle {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  radius: number;
  color: string;
  opacity: number;
}
