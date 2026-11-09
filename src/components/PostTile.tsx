import Link from "next/link";
import { ArrowRight } from "@carbon/icons-react";
import { PostMeta } from "@/components/PostMeta";
import { Tile } from "@/components/Tile";
import type { Post } from "@/lib/posts";

// One link per tile: the title, stretched over the tile (A9).
export function PostTile({
  post,
  className,
}: {
  post: Post;
  className?: string;
}) {
  return (
    <Tile
      mode="ink"
      as="article"
      interactive
      className={`relative flex min-h-(--post-tile) flex-col gap-tile-md [--tile-hover-bg:var(--color-paper)] ${className ?? ""}`}
    >
      <div>
        <PostMeta post={post} />
        <h3 className="mt-stack type-display-h3">
          <Link href={`/posts/${post.slug}`} className="link-stretched">
            {post.title}
          </Link>
        </h3>
      </div>
      <ArrowRight
        size={32}
        aria-hidden
        className="mt-auto size-icon-tile shrink-0"
      />
    </Tile>
  );
}
