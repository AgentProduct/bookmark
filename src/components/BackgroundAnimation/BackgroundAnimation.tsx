import { useEffect, useRef, type RefObject } from "react";
import * as d3 from "d3";
import type { Wave, Particle } from "../../types";

interface BackgroundAnimationProps {
  // 内容区容器 ref，用于读取尺寸并监听 resize
  contentRef: RefObject<HTMLDivElement | null>;
}

/**
 * D3 背景：3 条波浪 + 120 个粒子的循环动画。
 * 原本内联在 App 的一个大型 useEffect 中，现独立为组件。
 */
const BackgroundAnimation = ({ contentRef }: BackgroundAnimationProps) => {
  const backgroundRef = useRef<SVGSVGElement>(null);

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

    // 动画帧 id，供卸载时取消，避免组件卸载后动画循环继续运行导致资源泄漏
    let rafId: number;

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

        // 边界检测：超出则从另一侧出现
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });

      // 更新粒子元素
      particleElements.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      rafId = requestAnimationFrame(animateWave);
    };

    animateWave();

    // 监听内容区域尺寸变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect || {};
        svg.attr("width", width).attr("height", height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.unobserve(container);
    };
  }, [contentRef]);

  return <svg ref={backgroundRef} className="content-animation"></svg>;
};

export default BackgroundAnimation;
