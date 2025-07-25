// const dotenv = require("dotenv");
// const fs = require("node:fs");
// const WebSocket = require("ws");
import WebSocket from "ws";
import * as fs from "node:fs";
// import dotenv from "dotenv";

// Load the API key from the .env file
// dotenv.config();
// require('dotenv').config()
// console.log(process.env) // remove this after you've confirmed it is working

// const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// console.log("sigmaboi", ELEVENLABS_API_KEY);

const apiKey = "sk_8564e93449ea565370fdcc96f9a901f4603e39c38658499a";
const model = "eleven_flash_v2_5";
const voiceId = "Xb7hH8MSUJpSbSDYk0k2";
const baseUrl = "api.elevenlabs.io";
const numOfTrials = 1;

console.log("Using model:", model);
console.log("Using voice id:", voiceId);
console.log("Using base URL:", baseUrl);
console.log(`Measuring latency with ${numOfTrials} requests...\n`);

// Write the audio encoded in base64 string into local file
function writeToLocal(base64str, writeStream) {
  const audioBuffer = Buffer.from(base64str, "base64");
  writeStream.write(audioBuffer, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    }
  });
}

// This function initiates a WebSocket connection to stream text-to-speech requests.
async function textToSpeechInputStreaming(text) {
  return new Promise((resolve, reject) => {
    let firstByteTime;
    let startTime;
    let firstByte = true;

    const uri = `wss://${baseUrl}/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;
    const websocket = new WebSocket(uri, {
      headers: { "xi-api-key": ` ${apiKey}` },
    });

    // Create output folder for saving the audio into mp3
    const outputDir = "./output";
    try {
      fs.accessSync(outputDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      fs.mkdirSync(outputDir);
    }
    const writeStream = fs.createWriteStream(outputDir + "/test.mp3", {
      flags: "w",
    });

    // When connection is open, send the initial and subsequent text chunks.
    websocket.on("open", async () => {
      websocket.send(
        JSON.stringify({
          text: " ",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            use_speaker_boost: false,
          },
          generation_config: { chunk_length_schedule: [120, 160, 250, 290] },
        })
      );

      startTime = new Date().getTime();

      websocket.send(JSON.stringify({ text: text }));

      websocket.send(JSON.stringify({ text: "" }));
    });

    // Log received data and the time elapsed since the connection started.
    websocket.on("message", function incoming(event) {
      if (typeof startTime === "undefined") {
        throw new Error(
          "Start time is not recorded, please check whether websocket is open."
        );
      }
      const endTime = new Date().getTime();
      const elapsedMilliseconds = endTime - startTime;
      if (firstByte) {
        firstByteTime = elapsedMilliseconds;
        console.log(`Time to first byte: ${elapsedMilliseconds} ms`);
        firstByte = false;
      }

      // Generate audio from received data
      const data = JSON.parse(event.toString());
      if (data["audio"]) {
        writeToLocal(data["audio"], writeStream);
      }
    });

    // Log when the WebSocket connection closes and the total time elapsed.
    websocket.on("close", () => {
      writeStream.end();

      const endTime = new Date().getTime();
      if (typeof startTime === "undefined") {
        throw new Error(
          "Start time is not recorded, please check whether websocket is open."
        );
      }
      const elapsedMilliseconds = endTime - startTime;
      if (typeof firstByteTime === "undefined") {
        throw new Error(
          "Unable to measure latencies, please check your network connection and API key"
        );
      }
      resolve({
        firstByteTime,
        elapsedTime: elapsedMilliseconds,
      });
    });

    // Handle and log any errors that occur in the WebSocket connection.
    websocket.on("error", (error) => {
      console.log("WebSocket error:", error);
      reject(error);
    });
  });
}

export async function measureLatencies() {
  const text = "Test 1 test 2 test 3.";

  const result = await textToSpeechInputStreaming(text);
  console.log(`First byte time: ${result.firstByteTime} ms`);
  console.log(`Total elapsed time: ${result.elapsedTime} ms`);

  return result;
}

await measureLatencies();
