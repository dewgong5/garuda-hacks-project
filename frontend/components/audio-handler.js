// Audio handler for renderer process
class AudioHandler {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.processor = null;
        this.isCapturing = false;
        this.SAMPLE_RATE = 24000;
        this.BUFFER_SIZE = 4096;
        this.AUDIO_CHUNK_DURATION = 0.1;
    }

    async startCapture() {
        if (this.isCapturing) {
            console.log('🔄 Audio capture already running in renderer');
            return;
        }

        try {
            console.log('🎤 Requesting microphone access...');
            // Get microphone stream
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: this.SAMPLE_RATE,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });
            console.log('✅ Microphone access granted');

            console.log('🔧 Creating audio context...');
            // Create audio context
            this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.processor = this.audioContext.createScriptProcessor(this.BUFFER_SIZE, 1, 1);

            let audioBuffer = [];
            const samplesPerChunk = this.SAMPLE_RATE * this.AUDIO_CHUNK_DURATION;
            let chunkCount = 0;

            console.log('🎵 Setting up audio processing...');
            this.processor.onaudioprocess = (e) => {
                if (!this.isCapturing) return;

                const inputData = e.inputBuffer.getChannelData(0);
                audioBuffer.push(...inputData);

                // Process audio in chunks
                while (audioBuffer.length >= samplesPerChunk) {
                    const chunk = audioBuffer.splice(0, samplesPerChunk);
                    chunkCount++;
                    
                    // Send to main process
                    window.electronAPI?.sendAudioContent({
                        data: this.arrayBufferToBase64(new Float32Array(chunk).buffer),
                        mimeType: 'audio/pcm;rate=24000',
                    });
                    
                    if (chunkCount % 10 === 0) { // Log every 10th chunk to avoid spam
                        console.log('🎤 Audio chunk sent to main process (#', chunkCount, ')');
                    }
                }
            };

            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
            this.isCapturing = true;

            console.log('✅ Audio capture started successfully in renderer');
        } catch (error) {
            console.error('❌ Failed to start audio capture in renderer:', error);
            throw error;
        }
    }

    async stopCapture() {
        if (!this.isCapturing) {
            console.log('ℹ️ Audio capture not running in renderer');
            return;
        }

        try {
            console.log('🛑 Stopping audio capture in renderer...');
            
            if (this.processor) {
                console.log('🔌 Disconnecting audio processor...');
                this.processor.disconnect();
                this.processor = null;
            }

            if (this.audioContext) {
                console.log('🔌 Closing audio context...');
                await this.audioContext.close();
                this.audioContext = null;
            }

            if (this.mediaStream) {
                console.log('🎤 Stopping media stream tracks...');
                this.mediaStream.getTracks().forEach(track => track.stop());
                this.mediaStream = null;
            }

            this.isCapturing = false;
            console.log('✅ Audio capture stopped successfully in renderer');
        } catch (error) {
            console.error('❌ Error stopping audio capture in renderer:', error);
            throw error;
        }
    }

    arrayBufferToBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    isActive() {
        return this.isCapturing;
    }
}

// Export for use in components
window.AudioHandler = AudioHandler; 