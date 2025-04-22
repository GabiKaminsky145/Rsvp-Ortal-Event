require('dotenv').config({ path: '../.env' });

const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false, // Ensure SSL is enabled for connection
    }
});

console.log(process.env.DB_USER, process.env.DB_HOST, process.env.DB_NAME, process.env.DB_PASSWORD, process.env.DB_PORT);


// Get all guests with their category, RSVP status, and number of attendees
const getAllRSVPs = async () => {
    try {
        const res = await pool.query("SELECT guestname, status, category, attendees FROM rsvp-ortal");
        return res.rows;
    } catch (err) {
        console.error("❌ Error fetching RSVP data:", err);
        return [];
    }
};

// Get guest name by phone
const getGuestName = async (phone) => {
    try {
        const res = await pool.query("SELECT guestname FROM rsvp-ortal WHERE phone = $1", [phone]);
        return res.rows.length > 0 ? res.rows[0].guestname : null;
    } catch (err) {
        console.error("❌ Error fetching guest name:", err);
        return null;
    }
};

// Get guest category by phone
const getCategory = async (phone) => {
    try {
        const res = await pool.query("SELECT category FROM rsvp-ortal WHERE phone = $1", [phone]);
        return res.rows.length > 0 ? res.rows[0].category : null;
    } catch (err) {
        console.error("❌ Error fetching category:", err);
        return null;
    }
};

// Get guests with "maybe" status
const getMaybeGuests = async () => {
    try {
        const res = await pool.query("SELECT phone FROM rsvp-ortal WHERE status = 'maybe'");
        return res.rows.map(row => row.phone);
    } catch (err) {
        console.error("❌ Error fetching maybe guests:", err);
        return [];
    }
};

// Update RSVP status and attendees
const updateRSVP = async (phone, status, attendees = 0) => {
    try {
        if (status === "yes") {
            await pool.query(
                "UPDATE rsvp-ortal SET status = $1, attendees = $2 WHERE phone = $3",
                [status, attendees, phone]
            );
        } else {
            await pool.query(
                "UPDATE rsvp-ortal SET status = $1 WHERE phone = $2",
                [status, phone]
            );
        }
        console.log(`✅ Updated RSVP for ${phone} - Status: ${status}, Attendees: ${attendees}`);
    } catch (err) {
        console.error("❌ Error updating RSVP:", err);
    }
};

// Log undelivered WhatsApp messages
const logUndeliveredMessage = async (phone, guestname, category) => {
    try {
        await pool.query(
            "INSERT INTO errors-ortal (phone, guestname, category) VALUES ($1, $2, $3) " +
            "ON CONFLICT (phone) DO NOTHING",
            [phone, guestname, category]
        );
        console.log(`❌ Logged undelivered message for ${phone}`);
    } catch (err) {
        console.error("❌ Error logging undelivered message:", err);
    }
};

// Get all guests who didn't receive a WhatsApp message
const getUndeliveredMessages = async () => {
    try {
        const res = await pool.query("SELECT * FROM errors-ortal");
        return res.rows;
    } catch (err) {
        console.error("❌ Error fetching undelivered messages:", err);
        return [];
    }
};

module.exports = { pool, getAllRSVPs, getGuestName, getMaybeGuests,
    updateRSVP, logUndeliveredMessage, getUndeliveredMessages, getCategory };
