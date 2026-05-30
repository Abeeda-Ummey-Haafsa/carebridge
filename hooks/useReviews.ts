import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";

type ReviewRow = {
  id: number;
  rating: number;
  comment: string | null;
  care_type: string;
  reviewer_name: string;
  created_at: string;
};

type ReviewsResponse = {
  reviews: ReviewRow[];
  histogram: Record<string, number>;
  pagination: { page: number; limit: number };
};

export function useReviews() {
  const query = useInfiniteQuery({
    queryKey: ["caregiver", "reviews"],
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      const res = await fetchAPI(`/api/caregivers/me/reviews?${params}`);
      return res.data as ReviewsResponse;
    },
    getNextPageParam: (lastPage) => {
      const pageSize = lastPage.pagination.limit;
      return lastPage.reviews.length === pageSize
        ? lastPage.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
    staleTime: 10 * 60 * 1000,
  });

  const allReviews = query.data?.pages.flatMap((page) => page.reviews) ?? [];
  const ratingBreakdown = query.data?.pages[0]?.histogram ?? {};

  return {
    reviews: allReviews,
    ratingBreakdown,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
