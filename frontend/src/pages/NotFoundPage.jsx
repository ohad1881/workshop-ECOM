import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <Box
        sx={{
          textAlign: "center",
          py: 8,
        }}
      >
        <Typography variant="h1" sx={{ mb: 2 }}>
          404
        </Typography>
        <Typography variant="h3" sx={{ color: "#636E72", mb: 4 }}>
          Page Not Found
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
          sx={{
            background: "linear-gradient(135deg, #FF6B6B 0%, #06D6A0 100%)",
          }}
        >
          Go Home
        </Button>
      </Box>
    </Layout>
  );
};

export default NotFoundPage;
