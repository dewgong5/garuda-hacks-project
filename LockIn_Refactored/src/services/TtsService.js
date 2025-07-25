const WebSocket = require("ws");
const fs = require("node:fs");
const Speaker = require("speaker");

const apiKey = "sk_8564e93449ea565370fdcc96f9a901f4603e39c38658499a";
const model = "eleven_flash_v2_5";
const voiceId = "Xb7hH8MSUJpSbSDYk0k2";
const baseUrl = "api.elevenlabs.io";
const numOfTrials = 1;

console.log("Using model:", model);
console.log("Using voice id:", voiceId);
console.log("Using base URL:", baseUrl);
console.log(`Measuring latency with ${numOfTrials} requests...\n`);

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
let decoder = null;
let MPEGDecoder; // Will be loaded dynamically
async function streamMp3ChunkToSpeaker(base64str) {
  const audioBuffer = Buffer.from(base64str, "base64");
  if (!decoder) {
    if (!MPEGDecoder) {
      ({ MPEGDecoder } = await import("mpg123-decoder"));
    }
    decoder = new MPEGDecoder();
    await decoder.ready;
  }

  // Decode the MP3 chunk to PCM
  const { channelData, samplesDecoded, sampleRate } =
    decoder.decode(audioBuffer);

  // Interleave and convert Float32 to Int16
  const left = channelData[0];
  const right = channelData[1] || left;
  const interleaved = Buffer.alloc(samplesDecoded * 2 * 2); // 2 channels * 2 bytes per sample

  for (let i = 0; i < samplesDecoded; i++) {
    const l = Math.max(-1, Math.min(1, left[i])) * 32767;
    const r = Math.max(-1, Math.min(1, right[i])) * 32767;
    interleaved.writeInt16LE(l | 0, i * 4);
    interleaved.writeInt16LE(r | 0, i * 4 + 2);
  }

  if (!speakerStream) {
    speakerStream = new Speaker({
      channels: 2,
      bitDepth: 16,
      sampleRate: sampleRate,
      signed: true,
      float: false,
    });
  }

  speakerStream.write(interleaved);
}

// This function initiates a WebSocket connection to stream text-to-speech requests.
async function textToSpeechInputStreaming(text) {
  return new Promise((resolve, reject) => {
    let firstByteTime;
    let startTime;
    let firstByte = true;
    let chunkIndex = 1;

    const uri = `wss://${baseUrl}/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;
    const websocket = new WebSocket(uri, {
      headers: { "xi-api-key": ` ${apiKey}` },
    });

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

      const data = JSON.parse(event.toString());
      if (data["audio"]) {
        // Optionally save MP3 chunk:
        // writeChunkToFile(data["audio"], chunkIndex, outputDir);
        streamMp3ChunkToSpeaker(data["audio"]);
        chunkIndex++;
      }
    });

    websocket.on("close", () => {
      if (decoder) {
        decoder.free();
        decoder = null;
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

async function measureLatencies() {
  const text =
    "Hello we are in Indonesia. We love eating fried chicken in indonesia. I ride a car everyday. The sun is very hot.";

  const result = await textToSpeechInputStreaming(text);
  console.log(`First byte time: ${result.firstByteTime} ms`);
  console.log(`Total elapsed time: ${result.elapsedTime} ms`);

  return result;
}

if (require.main === module) {
  measureLatencies();
}

module.exports = {
  textToSpeechInputStreaming,
  measureLatencies,
};
