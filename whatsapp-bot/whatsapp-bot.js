const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { getGuestName, getMaybeGuests, updateRSVP, logUndeliveredMessage, getCategory } = require("../shared/db");
const fs = require("fs");

const waitingForPeople = {};
const userResponses = {};
const wazeLink = "https://waze.com/ul/hsv8tzr23w";

// Generate invite message
const generateInviteMessage = (guestName) => {
    const nameToUse = guestName ? guestName : "אורח";
    return `שלום, ${nameToUse}\n` +
        " שמחה להזמינך להפרשת חלה שתערך בתאריך 20.05.25\n" +
        "בחרי אחת מהאפשרויות והקלדי מספר (לדוגמא: השב 1 )\n" +
        "1️⃣ מגיעה\n" +
        "2️⃣ לא מגיעה\n" +
        "3️⃣ אולי";
};

const sendMessageWithDelay = async (chatId, guestName, category, delay) => {
    try {
        const media = MessageMedia.fromFilePath("./invite.jpeg"); // adjust the path to your image
        const messageText = generateInviteMessage(guestName);

        await client.sendMessage(chatId, media, { caption: messageText });
        console.log(`📨 Sent RSVP message with image to ${chatId}`);
    } catch (err) {
        console.error(`❌ Failed to send message to ${chatId}: ${err.message}`);
        await logUndeliveredMessage(chatId.replace("@c.us", ""), guestName, category);
    }
};

const sendMessagesToGuests = async (guests) => {
    const delayBetweenMessages = 3000;

    for (let phone of guests) {
        const chatId = phone + "@c.us";
        const guestName = await getGuestName(phone);
        const category = await getCategory(phone);

        await sendMessageWithDelay(chatId, guestName, category, delayBetweenMessages);
        await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
    }
};

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
    console.log("Scan the QR code below:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
    console.log("✅ Bot is ready!");

    const guestsToSend = await getMaybeGuests();
    await sendMessagesToGuests(guestsToSend);
});

client.on("message", async (msg) => {
    const userMessage = msg.body.trim();
    const senderId = msg.from.replace("@c.us", "");
    const guestName = await getGuestName(senderId);

    if (userResponses[senderId] && userMessage !== 'התחלה') {
        await client.sendMessage(msg.from, "⛔ כבר שלחת תשובה. אם ברצונך לשנות את בחירתך, שלחי את המילה 'התחלה' כדי לבחור מחדש.");
        return;
    }

    if (userMessage === "התחלה") {
        await client.sendMessage(msg.from, generateInviteMessage(guestName, senderId));
        delete waitingForPeople[senderId];
        delete userResponses[senderId];
        return;
    }

    if (waitingForPeople[senderId]) {
        if (/^\d+$/.test(userMessage)) {
            const numberOfPeople = parseInt(userMessage, 10);
            if (numberOfPeople <= 0 || numberOfPeople > 5) {
                await client.sendMessage(msg.from, "❌ מספר אנשים לא תקין. אנא שלחי מספר בין 1 ל- 5.");
                return;
            }
            await updateRSVP(senderId, "yes", numberOfPeople);
            await client.sendMessage(msg.from,
                "\nמתרגשת לראותך באירוע 🎉\n" +
                "נא להגיע בבגדים בהירים\n" +
                `מצורף לינק לוויז לדרך הגעה:📍\n${wazeLink}` +
                `\n\n במידה וישנו עדכון או שינוי\nבאפשרותך לשנות את בחירתך ע"י שליחת ההודעה 'התחלה'🔄`);
            delete waitingForPeople[senderId];
            userResponses[senderId] = "yes";
        } else {
            await client.sendMessage(msg.from, "❌ זה לא נראה כמו מספר. אנא שלח מספר תקני.");
        }
        return;
    }

    if (userMessage === "1" || userMessage === "כן" || userMessage === "מגיע") {
        await client.sendMessage(msg.from, "כמה תגיעו? (רשום מספר)");
        waitingForPeople[senderId] = true;
    } else if (userMessage === "2" || userMessage === "לא") {
        await updateRSVP(senderId, "no");
        await client.sendMessage(msg.from, "בסדר, תודה על המענה" +
            "\n באפשרותך לשנות את בחירתך ע\"י שליחת ההודעה 'התחלה'");
        userResponses[senderId] = "no";
    } else if (userMessage === "3" || userMessage === "אולי") {
        await updateRSVP(senderId, "maybe");
        await client.sendMessage(msg.from, "תודה על התשובה!🤔 " +
            "\nבאפשרותך לשנות את בחירתך ע\"י שליחת ההודעה 'התחלה'🔄");
        userResponses[senderId] = "maybe";
    } else {
        await client.sendMessage(msg.from, "אפשרות לא קיימת❌\n\n" +
            "🔹 *בחרי אחת מהאפשרויות וענה במספר (לדוגמא: השב 1 )*\n" +
            "1️⃣ מגיע/ה\n" +
            "2️⃣ לא מגיע/ה\n" +
            "3️⃣ אולי");
    }
});

client.initialize();
