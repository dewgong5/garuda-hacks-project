// const dotenv = require("dotenv");
// const fs = require("node:fs");
// const WebSocket = require("ws");
import WebSocket from "ws";
import * as fs from "node:fs";
import player from "play-sound";
import Speaker from "speaker";
import Lame from "lame";
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

// Remove playback queue and play-sound usage
// const play = player();
// const playbackQueue = [];
// let isPlaying = false;
// function playNextInQueue() { ... }

// Write the audio encoded in base64 string into local file (kept for reference)
function writeChunkToFile(base64str, chunkIndex, outputDir) {
  const audioBuffer = Buffer.from(base64str, "base64");
  const chunkFileName = `${outputDir}/chunk_${chunkIndex}.mp3`;
  fs.writeFile(chunkFileName, audioBuffer, (err) => {
    if (err) {
      console.error(`Error writing chunk ${chunkIndex} to file:`, err);
      return;
    }
    console.log(`Chunk ${chunkIndex} written to ${chunkFileName}`);
  });
}

// Stream MP3 chunks directly to speaker
let speakerStream = null;
let decoderStream = null;
function streamMp3ChunkToSpeaker(base64str) {
  const audioBuffer = Buffer.from(base64str, "base64");
  if (!decoderStream) {
    decoderStream = new Lame.Decoder();
    decoderStream.on("format", function (format) {
      speakerStream = new Speaker(format);
      decoderStream.pipe(speakerStream);
    });
  }
  decoderStream.write(audioBuffer);
}

// This function initiates a WebSocket connection to stream text-to-speech requests.
async function textToSpeechInputStreaming(text) {
  return new Promise((resolve, reject) => {
    let firstByteTime;
    let startTime;
    let firstByte = true;
    let chunkIndex = 1; // Counter for chunk files

    const uri = `wss://${baseUrl}/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;
    const websocket = new WebSocket(uri, {
      headers: { "xi-api-key": ` ${apiKey}` },
    });

    // Create output folder for saving the audio into mp3 (kept for reference)
    const outputDir = "./output";
    try {
      fs.accessSync(outputDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      fs.mkdirSync(outputDir);
    }

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
        // For reference: writeChunkToFile(data["audio"], chunkIndex, outputDir);
        // Stream directly to speaker:
        streamMp3ChunkToSpeaker(data["audio"]);
        chunkIndex++;
      }
    });

    websocket.on("close", () => {
      // End the decoder and speaker streams
      if (decoderStream) {
        decoderStream.end();
        decoderStream = null;
      }
      if (speakerStream) {
        speakerStream.end();
        speakerStream = null;
      }
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

    websocket.on("error", (error) => {
      console.log("WebSocket error:", error);
      reject(error);
    });
  });
}

export async function measureLatencies() {
  const text =
    "Hello we are in Indonesia. We love eating fried chicken in indonesia. I ride a car everyday. The sun is very hot.";

  const result = await textToSpeechInputStreaming(text);
  console.log(`First byte time: ${result.firstByteTime} ms`);
  console.log(`Total elapsed time: ${result.elapsedTime} ms`);

  return result;
}

await measureLatencies();
