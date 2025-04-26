require('dotenv').config({ path: '../.env' });

const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
    }
});

console.log(process.env.DB_USER, process.env.DB_HOST, process.env.DB_NAME, process.env.DB_PASSWORD, process.env.DB_PORT);

// =========================================
// RSVP FUNCTIONS
// =========================================

const getAllRSVPs = async () => {
    try {
        const res = await pool.query("SELECT guestname, status, category, attendees FROM rsvp_ortal");
        return res.rows;
    } catch (err) {
        console.error("❌ Error fetching RSVP data:", err);
        return [];
    }
};

const getGuestName = async (phone) => {
    try {
        const res = await pool.query("SELECT guestname FROM rsvp_ortal WHERE phone = $1", [phone]);
        return res.rows.length > 0 ? res.rows[0].guestname : null;
    } catch (err) {
        console.error("❌ Error fetching guest name:", err);
        return null;
    }
};

const getCategory = async (phone) => {
    try {
        const res = await pool.query("SELECT category FROM rsvp_ortal WHERE phone = $1", [phone]);
        return res.rows.length > 0 ? res.rows[0].category : null;
    } catch (err) {
        console.error("❌ Error fetching category:", err);
        return null;
    }
};

const getMaybeGuests = async () => {
    try {
        const res = await pool.query("SELECT phone FROM rsvp_ortal WHERE status = 'maybe'");
        return res.rows.map(row => row.phone);
    } catch (err) {
        console.error("❌ Error fetching maybe guests:", err);
        return [];
    }
};

const updateRSVP = async (phone, status, attendees = 0) => {
    try {
        if (status === "yes") {
            await pool.query(
                "UPDATE rsvp_ortal SET status = $1, attendees = $2, bot_active = FALSE, waiting_for_people = FALSE WHERE phone = $3",
                [status, attendees, phone]
            );
        } else {
            await pool.query(
                "UPDATE rsvp_ortal SET status = $1, bot_active = FALSE, waiting_for_people = FALSE WHERE phone = $2",
                [status, phone]
            );
        }
        console.log(`✅ Updated RSVP for ${phone} - Status: ${status}, Attendees: ${attendees}`);
    } catch (err) {
        console.error("❌ Error updating RSVP:", err);
    }
};

// =========================================
// BOT STATE FUNCTIONS
// =========================================

// Get bot_active state
const isBotActive = async (phone) => {
    try {
        const res = await pool.query("SELECT bot_active FROM rsvp_ortal WHERE phone = $1", [phone]);
        return res.rows.length > 0 ? res.rows[0].bot_active : false;
    } catch (err) {
        console.error("❌ Error fetching bot_active:", err);
        return false;
    }
};

// Set bot_active true or false
const setBotActive = async (phone, active) => {
    try {
        await pool.query(
            "UPDATE rsvp_ortal SET bot_active = $1 WHERE phone = $2",
            [active, phone]
        );
        console.log(`🔄 Set bot_active=${active} for ${phone}`);
    } catch (err) {
        console.error("❌ Error setting bot_active:", err);
    }
};

// Get waiting_for_people state
const isWaitingForPeople = async (phone) => {
    try {
        const res = await pool.query("SELECT waiting_for_people FROM rsvp_ortal WHERE phone = $1", [phone]);
        return res.rows.length > 0 ? res.rows[0].waiting_for_people : false;
    } catch (err) {
        console.error("❌ Error fetching waiting_for_people:", err);
        return false;
    }
};

// Set waiting_for_people true or false
const setWaitingForPeople = async (phone, waiting) => {
    try {
        await pool.query(
            "UPDATE rsvp_ortal SET waiting_for_people = $1 WHERE phone = $2",
            [waiting, phone]
        );
        console.log(`🔄 Set waiting_for_people=${waiting} for ${phone}`);
    } catch (err) {
        console.error("❌ Error setting waiting_for_people:", err);
    }
};

// =========================================
// UNDELIVERED MESSAGES FUNCTIONS
// =========================================

const logUndeliveredMessage = async (phone, guestname, category) => {
    try {
        await pool.query(
            "INSERT INTO errors_ortal (phone, guestname, category) VALUES ($1, $2, $3) " +
            "ON CONFLICT (phone) DO NOTHING",
            [phone, guestname, category]
        );
        console.log(`❌ Logged undelivered message for ${phone}`);
    } catch (err) {
        console.error("❌ Error logging undelivered message:", err);
    }
};

const getUndeliveredMessages = async () => {
    try {
        const res = await pool.query("SELECT * FROM errors_ortal");
        return res.rows;
    } catch (err) {
        console.error("❌ Error fetching undelivered messages:", err);
        return [];
    }
};

// =========================================
// EXPORT FUNCTIONS
// =========================================

module.exports = {
    pool,
    getAllRSVPs,
    getGuestName,
    getMaybeGuests,
    updateRSVP,
    logUndeliveredMessage,
    getUndeliveredMessages,
    getCategory,
    isBotActive,
    setBotActive,
    isWaitingForPeople,
    setWaitingForPeople
};
