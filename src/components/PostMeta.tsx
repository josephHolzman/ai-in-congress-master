import { Pill } from "@/components/Pill";
import { formatDate } from "@/lib/dates";
import type { Post } from "@/lib/posts";

export function PostMeta({ post }: { post: Post }) {
  return (
    <div className="flex flex-wrap items-center gap-stack">
      <Pill>{post.category}</Pill>
      <time dateTime={post.date} className="type-heading-h5 text-tile-muted">
        {formatDate(post.date)}
      </time>
    </div>
  );
}
