import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setApiError("");
    setIsLoading(true);

    try {
      const response = await authAPI.login(data.email, data.password);
      const { access, refresh, user } = response.data;

      login(user, access, refresh);
      navigate("/");
    } catch (error) {
      const message =
        error.response?.data?.detail || "Login failed. Please try again.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 400,
          p: 4,
        }}
      >
        <Typography variant="h3" sx={{ mb: 3, textAlign: "center" }}>
          Login
        </Typography>

        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{ mb: 2 }}
            disabled={isLoading}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{ mb: 3 }}
            disabled={isLoading}
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            sx={{
              background: "linear-gradient(135deg, #FF6B6B 0%, #06D6A0 100%)",
              py: 1.5,
            }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2">
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "#FF6B6B",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Register here
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginForm;
