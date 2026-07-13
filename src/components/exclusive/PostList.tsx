import type { ExclusivePost } from '@/lib/webiny/types';
import PostCard from './PostCard';

interface PostListProps {
  posts: ExclusivePost[];
}

export default function PostList({ posts }: PostListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
