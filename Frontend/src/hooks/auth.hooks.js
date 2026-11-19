import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiInstance } from "../api";
import { tokenStorage } from "../utils/secureStorage";
import {
  firebaseGoogleSignIn,
  firebaseResetPassword,
  firebaseSignIn,
  firebaseSignUp,
  mapFirebaseAuthError,
} from "../util/authService/firebaseAuth";

async function exchangeFirebaseSession(payload) {
  const { data } = await apiInstance.post("/auth/firebase", {
    idToken: payload.idToken,
    firstname: payload.firstname,
    lastname: payload.lastname,
  });
  const token = data.data.token;
  if (token) tokenStorage.set(token);
  return data;
}

export const useSignup = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ firstname, lastname, email, password }) => {
      // Prefer Firebase Auth (free), then sync Mongo + app JWT
      try {
        const firebaseSession = await firebaseSignUp({
          email,
          password,
          firstname,
          lastname,
        });
        return exchangeFirebaseSession(firebaseSession);
      } catch (firebaseError) {
        // Fallback to classic Mongo signup if Firebase Auth is not enabled yet
        if (
          firebaseError?.code === "auth/operation-not-allowed" ||
          firebaseError?.code === "auth/configuration-not-found"
        ) {
          const { data } = await apiInstance.post("/auth/sign-up", {
            firstname,
            lastname,
            email,
            password,
          });
          const token = data.data.token;
          if (token) tokenStorage.set(token);
          return data;
        }
        const err = new Error(mapFirebaseAuthError(firebaseError));
        err.cause = firebaseError;
        throw err;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      console.error(
        "Signup failed:",
        error.response?.data?.error || error.message
      );
    },
  });
  return mutation;
};

export const useSignin = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ email, password }) => {
      try {
        const firebaseSession = await firebaseSignIn({ email, password });
        return exchangeFirebaseSession(firebaseSession);
      } catch (firebaseError) {
        // Fallback: existing Mongo/JWT users
        try {
          const { data } = await apiInstance.post("/auth/sign-in", {
            email,
            password,
          });
          const token = data.data.token;
          if (token) tokenStorage.set(token);
          return data;
        } catch (mongoError) {
          const err = new Error(
            mapFirebaseAuthError(firebaseError) ||
              mongoError.response?.data?.error ||
              "Failed to sign in"
          );
          throw err;
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      console.error(
        "Signin failed:",
        error.response?.data?.error || error.message
      );
    },
  });
  return mutation;
};

export const useGoogleSignin = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const firebaseSession = await firebaseGoogleSignIn();
      return exchangeFirebaseSession(firebaseSession);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      console.error("Google sign-in failed:", mapFirebaseAuthError(error));
    },
  });
  return mutation;
};

export const useFirebasePasswordReset = () => {
  return useMutation({
    mutationFn: async (email) => {
      await firebaseResetPassword(email);
      return true;
    },
  });
};

export const useLoggedInUser = () => {
  const query = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await apiInstance.get("/auth/me");
      if (!data.isLoggedIn) return false;
      return data.data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  return query;
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ firstname, lastname }) => {
      const { data } = await apiInstance.put("/auth/update-profile", {
        firstname,
        lastname,
      });
      return data.data.user;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      console.error('Profile update failed:', error.response?.data?.error || error.message);
    },
  });
  return mutation;
};
