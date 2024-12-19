import { TwitterApi } from "twitter-api-v2";
import cron from "node-cron";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prompts from "./prompts.js";

// Google AI keys
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
});

const generationConfig = {
    temperature: 2,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

// Twitter API keys
const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Prompts for AI content
function getRandomPrompt() {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
}

// Function to generate AI content
async function generateContent() {
    try {
        const chatSession = model.startChat({
            generationConfig,
            history: [],
        });

        const result = await chatSession.sendMessage(
            `${getRandomPrompt()} Only output the tweet text, nothing else`
        );
        return result.response.text();
    } catch (error) {
        throw error;
    }
}

// Post to Twitter
async function postToTwitter() {
    try {
        const content = await generateContent();
        const res = await client.v2.tweet({
            text: content,
        });
        console.log("Tweet posted: ", res);
    } catch (error) {
        console.log(error);
    }
}

// Schedule posts every hour
cron.schedule("0 */2 * * *", () => {
    console.log("Posting new tweet...");
    postToTwitter();
});
