import { createContext, useState, useContext, useEffect } from "react";
import AxiosInstance from "../components/AxiosInstance";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("access_token");

  // =========================
  // LOGIN
  // =========================
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await AxiosInstance.post("auth/login/", {
        username,
        password,
      });

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        await fetchUserData();
      }

      return data;
    } catch (err) {
      const isTimeout = err.code === "ECONNABORTED";
      setError(
        err.response?.data?.detail ||
        (isTimeout ? "Login timed out. Please check that the backend server is running." : "Login failed")
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH USER
  // =========================
  const fetchUserData = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setUser(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await AxiosInstance.get("auth/user/");

      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));

      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch user");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // REFRESH USER
  // =========================
  const refreshUser = async () => {
    return await fetchUserData();
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    try {
      await AxiosInstance.post("auth/logout/");
    } catch (err) {
      console.error(err);
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setUser(null);
  };

  // =========================
  // REFRESH TOKEN
  // =========================
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");

      const { data } = await AxiosInstance.post("auth/refresh/", {
        refresh,
      });

      localStorage.setItem("access_token", data.access);

      return data.access;
    } catch (err) {
      logout();
    }
  };

  // =========================
  // GET CURRENT USER FROM TOKEN
  // =========================
  const getUserFromToken = () => {
    const token = localStorage.getItem("access_token");

    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch {
      return null;
    }
  };

  // =========================
  // AUTO LOAD USER
  // =========================
  useEffect(() => {
    if (token && !user) {
      fetchUserData();
    }
  }, [token]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        logout,
        refreshUser,
        refreshToken,
        getUserFromToken,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
