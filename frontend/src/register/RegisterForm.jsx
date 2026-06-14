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
const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one digit"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register: setAuth } = useAuth();
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setApiError("");
    setIsLoading(true);

    try {
      const response = await authAPI.register(
        data.email,
        data.username,
        data.password,
      );
      const { access, refresh, user } = response.data;

      setAuth(user, access, refresh);
      navigate("/profile");
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        "Registration failed. Please try again.";
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
          Register
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
            label="Username"
            {...register("username")}
            error={!!errors.username}
            helperText={errors.username?.message}
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
            sx={{ mb: 2 }}
            disabled={isLoading}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            {...register("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
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
            {isLoading ? <CircularProgress size={24} /> : "Register"}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2">
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#FF6B6B",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Login here
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default RegisterForm;
