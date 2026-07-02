import type { Bookmark } from "../../types";
import BookmarkCard from "../BookmarkCard/BookmarkCard";

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  compactMode: boolean;
  isAnimating: boolean;
}

/**
 * 书签网格容器：负责紧凑模式切换与淡入动画
 */
const BookmarkGrid = ({
  bookmarks,
  compactMode,
  isAnimating,
}: BookmarkGridProps) => {
  return (
    <div
      className={`bookmark-grid ${compactMode ? "compact" : ""} ${isAnimating ? "fade-in" : ""}`}
    >
      {bookmarks.length > 0 ? (
        bookmarks.map((b) => <BookmarkCard key={b.id} {...b} />)
      ) : (
        <div className="empty-state">该分类下暂无书签</div>
      )}
    </div>
  );
};

export default BookmarkGrid;
