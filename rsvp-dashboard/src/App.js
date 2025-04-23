import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Box, Card, CardContent, Typography, List, ListItem, Button, Grid, Collapse } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

function Dashboard() {
  const [data, setData] = useState({ yes: { guests: [], total: 0 }, no: { guests: [], total: 0 }, maybe: { guests: [], total: 0 } });
  const [open, setOpen] = useState({ yes: false, no: false, maybe: false });
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("https://hprsht-khlh.onrender.com/rsvp")
      .then((response) => setData(response.data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleToggle = (status) => {
    setOpen((prevOpen) => ({
      ...prevOpen,
      [status]: !prevOpen[status],
    }));
    setExpanded(true);
  };

  const groupByCategory = (guests) => {
    return guests.reduce((acc, guest) => {
      if (!acc[guest.category]) acc[guest.category] = [];
      acc[guest.category].push(guest);
      return acc;
    }, {});
  };

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h3" align="center" gutterBottom sx={{ fontSize: { xs: "2rem", md: "3rem" }, color: "#4caf50", fontWeight: 'bold' }}>
        אישורי הגעה - הפרשת חלה
      </Typography>

      <Box display="flex" justifyContent="center" gap={3} mb={4} flexWrap="wrap">
        {["yes", "no", "maybe"].map((status) => (
          <Card
            key={status}
            sx={{
              p: 3,
              backgroundColor: getStatusColor(status),
              color: "white",
              minWidth: { xs: 120, sm: 150 },
              flexGrow: 1,
              textAlign: "center",
              borderRadius: 3,
              boxShadow: 8,
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: 12,
              }
            }}
          >
            <Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 'bold' }}>
              {status.toUpperCase()}
            </Typography>
            <Typography variant="h6" sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }}>
              {data[status].total} Attendees
            </Typography>
          </Card>
        ))}
      </Box>

      <Grid container spacing={3}>
        {["yes", "no", "maybe"].map((status) => (
          <Grid item xs={12} sm={6} md={4} key={status}>
            <Card sx={{ backgroundColor: getStatusColor(status), borderRadius: 3, boxShadow: 5 }}>
              <CardContent>
                <Typography variant="h6" align="center" color="white" gutterBottom sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, fontWeight: 'bold' }}>
                  {status.toUpperCase()} ({data[status].total})
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={() => handleToggle(status)}
                  sx={{
                    mt: 2,
                    backgroundColor: '#9c27b0', // Purple button color
                    '&:hover': { backgroundColor: '#7b1fa2' }, // Darker purple on hover
                    color: 'white',
                    borderRadius: 3,
                    fontSize: '0.875rem', // Smaller font size for better aesthetics
                    fontFamily: '"Roboto", "Arial", sans-serif', // Elegant font family
                    fontWeight: '500', // Lighter font weight for a more modern look
                    padding: '8px 16px', // Adjust padding for a balanced look
                  }}
                  endIcon={<ExpandMoreIcon />}
                >
                  {open[status] ? (
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: '500' }}>Hide Details</Typography>
                  ) : (
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: '500' }}>Show Details</Typography>
                  )}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4}>
        <Collapse in={expanded}>
          {["yes", "no", "maybe"].map((status) => {
            if (!open[status]) return null;
            const groupedGuests = groupByCategory(data[status].guests);
            return (
              <Box key={status} mb={4}>
                <Typography variant="h5" sx={{ color: getStatusColor(status), textAlign: "center", mb: 2, fontWeight: 'bold' }}>
                  {status.toUpperCase()} ({data[status].total} Guests)
                </Typography>
                <Grid container spacing={3}>
                  {Object.keys(groupedGuests).map((category, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ backgroundColor: "#f5f5f5", borderRadius: 3, height: "100%", boxShadow: 4, p: 3 }}>
                        <Typography variant="subtitle1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                          {category}
                        </Typography>
                        <List dense>
                          {groupedGuests[category].map((guest, i) => (
                            <ListItem key={i} sx={{ pl: 0 }}>
                              <Typography variant="body2">
                                {guest.guestname} ({guest.attendees} Attendees)
                              </Typography>
                            </ListItem>
                          ))}
                        </List>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })}
        </Collapse>
      </Box>

      <Box display="flex" justifyContent="center" mt={5} gap={3}>
        <Button variant="contained" color="primary" size="large" onClick={() => navigate("/messagesStatus")}>
          View Undelivered Messages
        </Button>
      </Box>
    </Container>
  );
}

function UndeliveredMessages() {
  const [undeliveredGuests, setUndeliveredGuests] = useState([]);

  useEffect(() => {
    axios
      .get("https://hprsht-khlh.onrender.com/messagesStatus")
      .then((response) => setUndeliveredGuests(response.data))
      .catch((error) => console.error("Error fetching undelivered data:", error));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h3" align="center" gutterBottom sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 'bold', color: "#4caf50" }}>
        Undelivered Messages
      </Typography>
      <List>
        {undeliveredGuests.map((guest) => (
          <ListItem key={guest.phone}>
            <Typography variant="body2">
              {guest.guestname} (Phone: {guest.phone}, Category: {guest.category})
            </Typography>
          </ListItem>
        ))}
      </List>
      <Box display="flex" justifyContent="center" mt={4}>
        <Button variant="contained" color="secondary" component={Link} to="/" size="large">
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case "yes":
      return "#4caf50"; // green
    case "no":
      return "#f44336"; // red
    case "maybe":
      return "#ff9800"; // orange
    default:
      return "#9e9e9e"; // gray fallback
  }
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/messagesStatus" element={<UndeliveredMessages />} />
      </Routes>
    </Router>
  );
}
