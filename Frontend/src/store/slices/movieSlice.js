import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiInstance } from "../../api";

const initialState = {
    _id: null,
    title: null,
    description: null,
    language: null,
    imageURL: null,
    durationInMinutes: null,
    genre: [],
    categories: [],
    adultRating: null,
    isLoading: false,
    error: null,
}

export const fetchMovie = createAsyncThunk(
    'movie/fetchMovie',
    async (movieId, { rejectWithValue }) => {
        try {
            const {data} = await apiInstance.get(`/api/movies/${movieId}`);
            const movie = data.data;
            if (!movie) return rejectWithValue('Movie not found');
            return movie;
        } catch (error) {
            console.log('error', error);
            return rejectWithValue(error.response?.data?.error || error.message || 'Failed to load movie');
        }
    }
);

const moveiSlice = createSlice({
    name:"movie",
    initialState,
    reducers: {
      clearMovie: () => initialState,
    },
    extraReducers: (builder) => {
        builder.addCase(fetchMovie.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchMovie.fulfilled, (state, action) => {
            const movie = action.payload;
            if (!movie) {
              state.isLoading = false;
              state.error = 'Movie not found';
              return;
            }
            state._id = movie._id;
            state.isLoading = false;
            state.title = movie.title;
            state.description = movie.description;
            state.language = movie.language;
            state.imageURL = movie.imageURL;
            state.durationInMinutes = movie.durationInMinutes;
            state.genre = movie.genre || [];
            state.categories = movie.categories || [];
            state.adultRating = movie.adultRating || null;
            state.error = null;
        });
        builder.addCase(fetchMovie.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload || 'Failed to load movie';
        });
    }
});

export const { clearMovie } = moveiSlice.actions;
export default moveiSlice.reducer;
