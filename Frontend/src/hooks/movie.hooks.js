import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiInstance } from "../api";

export const useCreateMovie = () => {
  const queryClient = useQueryClient();
  const movie = useMutation({
    mutationFn: async ({
      title,
      description,
      language,
      imageURL,
      durationInMinutes,
    }) => {
      const { data } = await apiInstance.post("/admin/movies", {
        title,
        description,
        language,
        imageURL,
        durationInMinutes,
      });
      return data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });
  return movie;
};

export const useGetAllMovies = () => {
  const movies = useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data } = await apiInstance.get("/api/movies");
      return Array.isArray(data?.data) ? data.data : [];
    },
  });
  return movies;
};

export const useGetMovieById = (movieId) => {
  return useQuery({
    queryKey: ["movie", movieId],
    enabled: Boolean(movieId),
    queryFn: async () => {
      const { data } = await apiInstance.get(`/api/movies/${movieId}`);
      return data?.data || null;
    },
  });
};

export const useGetLatest10Movies = () => {
  const movies = useQuery({
    queryKey: ["movies", "latest"],
    queryFn: async () => {
      const { data } = await apiInstance.get("/api/movies");
      const list = Array.isArray(data?.data) ? data.data : [];
      return [...list]
        .sort((a, b) => {
          const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
          const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
          return bTime - aTime;
        })
        .slice(0, 10);
    },
  });
  return movies;
};
