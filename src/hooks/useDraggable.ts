import {
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
  type RefObject,
} from "react";

// 拖拽偏移量
interface Offset {
  x: number;
  y: number;
}

// 弹框拖拽时与视口边缘保留的最小间距，避免贴边
const DRAG_EDGE_MARGIN = 8;

interface UseDraggableOptions {
  // 弹框每次显示（visible 从 false→true 或首次为 true）时自动居中
  centerOnMount?: boolean;
  // 弹框是否可见，作为居中 effect 的触发依赖
  visible?: boolean;
}

/**
 * 可拖拽弹框的通用 hook
 * - modalRef：弹框容器 ref
 * - options.centerOnMount + options.visible：显示时自动居中（上下左右居中）
 * - 返回 onDragStart，绑定到拖拽手柄（如 header）的 onMouseDown
 *
 * 原来翻译弹框与 AI 弹框各写了一份近乎相同的拖拽逻辑，这里统一复用。
 */
export const useDraggable = (
  modalRef: RefObject<HTMLDivElement | null>,
  options?: UseDraggableOptions
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Offset>({ x: 0, y: 0 });

  // 显示时居中：用 useLayoutEffect 在浏览器绘制前定位，避免首帧错位闪烁。
  // 关键点：必须把 visible 放入依赖。弹框用 `if(!visible) return null`，组件实例始终存在，
  // 仅依赖 modalRef（稳定引用）和 centerOnMount（常量）时，visible 由 false→true 不会触发本 effect，
  // 弹框会停留在 CSS 默认 left/top 而不居中。
  useLayoutEffect(() => {
    if (!options?.centerOnMount || !options?.visible || !modalRef.current)
      return;
    const el = modalRef.current;
    const left = Math.max(
      DRAG_EDGE_MARGIN,
      (window.innerWidth - el.offsetWidth) / 2
    );
    const top = Math.max(
      DRAG_EDGE_MARGIN,
      (window.innerHeight - el.offsetHeight) / 2
    );
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [modalRef, options?.centerOnMount, options?.visible]);

  // 拖拽起始：记录鼠标相对弹框左上角的偏移
  const onDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!modalRef.current) return;
      setIsDragging(true);
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [modalRef]
  );

  // 拖拽移动：限制在视口范围内（边缘保留最小间距）
  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !modalRef.current) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 确保弹框不会超出视口，并在边缘保留最小间距
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;

      const finalX = Math.max(
        DRAG_EDGE_MARGIN,
        Math.min(newX, viewportWidth - modalWidth - DRAG_EDGE_MARGIN)
      );
      const finalY = Math.max(
        DRAG_EDGE_MARGIN,
        Math.min(newY, viewportHeight - modalHeight - DRAG_EDGE_MARGIN)
      );

      modalRef.current.style.left = `${finalX}px`;
      modalRef.current.style.top = `${finalY}px`;
    },
    [isDragging, dragOffset, modalRef]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 拖拽期间挂载/卸载全局监听
  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);

    return () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  return { onDragStart };
};
