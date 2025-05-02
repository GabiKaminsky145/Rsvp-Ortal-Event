const express = require("express");
const cors = require("cors");
const { getAllRSVPs, getUndeliveredMessages } = require("./shared/db");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// API to get RSVP data with attendees count
app.get("/rsvp", async (req, res) => {
    try {
        const rsvpData = await getAllRSVPs();

        if (!rsvpData || rsvpData.length === 0) {
            return res.status(404).json({ error: "No RSVP data found" });
        }

        // Add 'not_responded' group
        const groupedData = {
            yes: { guests: [], total: 0 },
            no: { guests: [], total: 0 },
            maybe: { guests: [], total: 0 },
            not_responded: { guests: [], total: 0 }
        };

        rsvpData.forEach(guest => {
            const status = guest.status?.toLowerCase();
            if (groupedData[status]) {
                groupedData[status].guests.push(guest);
                groupedData[status].total += guest.attendees;
            } else {
                // If status is undefined, null, or unrecognized
                groupedData.not_responded.guests.push(guest);
                groupedData.not_responded.total += guest.attendees || 0;
            }
        });

        res.json(groupedData);
    } catch (error) {
        console.error("❌ Error fetching RSVP data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// API to get undelivered messages
app.get("/messagesStatus", async (req, res) => {
    try {
        const undelivered = await getUndeliveredMessages();
        res.json(undelivered);
    } catch (error) {
        console.error("❌ Error fetching undelivered messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
