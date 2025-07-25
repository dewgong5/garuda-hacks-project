// example.mts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { AddVoiceIvcResponseModel } from "@elevenlabs/elevenlabs-js/api";
import "dotenv/config";
import fs from "node:fs";

const elevenlabs = new ElevenLabsClient();

const voice: AddVoiceIvcResponseModel = await elevenlabs.voices.ivc.create({
    name: "My Voice Clone",

    files: [
        fs.createReadStream(
            "/other/sample_audio/test.mp3",
        ),
    ],
});

console.log(voice.voiceId);
