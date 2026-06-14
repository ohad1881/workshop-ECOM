import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <Box
        sx={{
          textAlign: "center",
          py: 8,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            mb: 2,
            background: "linear-gradient(135deg, #FF6B6B 0%, #06D6A0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Welcome to GiftGraph
        </Typography>

        <Typography variant="h4" sx={{ color: "#636E72", mb: 4 }}>
          Find the perfect gift powered by AI
        </Typography>

        {!isAuthenticated ? (
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/login")}
              sx={{
                background: "linear-gradient(135deg, #FF6B6B 0%, #06D6A0 100%)",
              }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/register")}
              sx={{
                borderColor: "#FF6B6B",
                color: "#FF6B6B",
              }}
            >
              Register
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/gift-finder")}
            sx={{
              background: "linear-gradient(135deg, #FF6B6B 0%, #06D6A0 100%)",
            }}
          >
            Find a Gift
          </Button>
        )}
      </Box>
    </Layout>
  );
};

export default HomePage;
