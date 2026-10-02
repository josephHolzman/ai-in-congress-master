import Link from "next/link";
import { ActionRow } from "@/components/ActionRow";
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
      mode="paper"
      as="article"
      interactive
      className={`relative flex min-h-(--post-tile) flex-col gap-tile-md ${className ?? ""}`}
    >
      <div>
        <PostMeta post={post} />
        <h3 className="mt-stack type-display-h3">
          <Link href={`/posts/${post.slug}`} className="link-stretched">
            {post.title}
          </Link>
        </h3>
      </div>
      <div className="mt-auto">
        <ActionRow label="Read more" decorative />
      </div>
    </Tile>
  );
}
