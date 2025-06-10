/**
 * Audio utilities for recording and playback
 */

// Start audio recording with the Web Audio API
export const startRecording = async (): Promise<{
  mediaRecorder: MediaRecorder;
  stream: MediaStream;
}> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start(1000); // Collect data every second
    
    return { mediaRecorder, stream };
  } catch (error) {
    console.error('Error accessing microphone:', error);
    throw new Error('Could not access microphone. Please check permissions.');
  }
};

// Stop recording and get the audio blob
export const stopRecording = (
  mediaRecorder: MediaRecorder,
  stream: MediaStream
): Promise<Blob> => {
  return new Promise((resolve) => {
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      
      // Stop all tracks to release microphone
      stream.getTracks().forEach((track) => track.stop());
      
      resolve(audioBlob);
    };

    mediaRecorder.stop();
  });
};

// Create an audio element and play the blob
export const playAudio = (audioBlob: Blob): HTMLAudioElement => {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
  };
  
  audio.play().catch(error => {
    console.error('Error playing audio:', error);
  });
  
  return audio;
};

// Handle barge-in by stopping current audio playback
export const stopAudioPlayback = (audioElement: HTMLAudioElement | null): void => {
  if (audioElement) {
    audioElement.pause();
    if (audioElement.src) {
      URL.revokeObjectURL(audioElement.src);
    }
  }
}; 