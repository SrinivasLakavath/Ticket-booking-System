import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetAllMovies } from "../../hooks/movie.hooks";
import { fetchMovie } from '../../store/slices/movieSlice';

const GENRE_OPTIONS = [
  "all",
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
];

const Explore = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: movies } = useGetAllMovies();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const handleNavigation = (id) => {
    dispatch(fetchMovie(id));
    navigate(`/movies/${id}`);
  }

  const availableGenres = useMemo(() => {
    const fromData = new Set();
    movies?.forEach((movie) => {
      (movie.genre || []).forEach((g) => fromData.add(g));
    });
    const merged = GENRE_OPTIONS.filter((g) => g === "all" || fromData.has(g));
    // Keep any seeded genres not in the default chip list
    fromData.forEach((g) => {
      if (!merged.includes(g)) merged.push(g);
    });
    return merged;
  }, [movies]);

  // Filter movies by title/description and genre
  const filteredMovies = movies?.filter((movie) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      movie.title?.toLowerCase().includes(query) ||
      movie.description?.toLowerCase().includes(query) ||
      (movie.genre || []).some((g) => g.toLowerCase().includes(query));

    const matchesGenre =
      selectedGenre === "all" ||
      (Array.isArray(movie.genre) && movie.genre.includes(selectedGenre));

    return matchesSearch && matchesGenre;
  }) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovies = filteredMovies.slice(startIndex, startIndex + itemsPerPage);

  const syncParams = (nextQuery, nextGenre) => {
    const params = {};
    if (nextQuery.trim()) params.q = nextQuery.trim();
    if (nextGenre && nextGenre !== "all") params.genre = nextGenre;
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    syncParams(searchQuery, selectedGenre);
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Search Bar Section */}
      <div className="bg-base-200 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2 text-base-content font-display">Explore CineSeat</h1>
          <p className="text-base-content/70 mb-6">Search by title or filter by genre to find your next show.</p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="join w-full max-w-2xl">
            <input
              type="text"
              placeholder="Search by title, genre, or description..."
              className="input input-bordered join-item flex-1"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <button type="submit" className="btn btn-primary join-item btn-square" aria-label="Search movies">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Filter Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3 text-base-content">Filter by Genre</h3>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  className={`btn btn-sm ${selectedGenre === genre ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    setSelectedGenre(genre);
                    setCurrentPage(1);
                    syncParams(searchQuery, genre);
                  }}>
                  {genre === "all" ? "All Genres" : genre}
                </button>
              ))}
            </div>
            <p className="text-sm text-base-content/60 mt-3">
              Showing {filteredMovies.length} movie{filteredMovies.length === 1 ? "" : "s"}
              {selectedGenre !== "all" ? ` in ${selectedGenre}` : ""}
              {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="container mx-auto px-4 py-8">
        {paginatedMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedMovies.map((movie) => (
                <div
                  key={movie._id}
                  className="card bg-base-100 shadow-xl image-full cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => handleNavigation(movie._id)}>
                  <figure>
                    <img
                      src={movie.imageURL}
                      alt={movie.title}
                      className="w-full h-80 object-cover"
                    />
                  </figure>
                  <div className="card-body p-4">
                    <h2 className="card-title text-lg">{movie.title}</h2>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {(movie.genre || []).slice(0, 3).map((g) => (
                        <span key={g} className="badge badge-sm badge-secondary">{g}</span>
                      ))}
                    </div>
                    <p className="text-sm line-clamp-3">{movie.description}</p>
                    <div className="card-actions justify-end mt-2">
                      <button className="btn btn-primary btn-sm">View Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="join">
                  <button
                    className="join-item btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}>
                    «
                  </button>
                  <button className="join-item btn">
                    Page {currentPage} of {totalPages}
                  </button>
                  <button
                    className="join-item btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}>
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            {movies ? (
              <p className="text-xl text-base-content opacity-70">
                No movies found matching your criteria.
              </p>
            ) : (
              <span className="loading loading-spinner loading-lg text-primary"></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
