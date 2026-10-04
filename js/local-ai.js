import {
  pipeline,
  env
} from "../node_modules/@huggingface/transformers/dist/transformers.min.js";


// ========================================
// NoorCare Local AI Configuration
// ========================================

// Allow models stored on this device.
env.allowLocalModels = true;

// IMPORTANT:
// Never download a model from the internet.
env.allowRemoteModels = false;

// Local model directory.
env.localModelPath = "/models/";


// Local ONNX Runtime WASM
env.backends.onnx.wasm.wasmPaths = {
  "ort-wasm-simd-threaded.jsep.wasm":
    "/vendor/onnx/ort-wasm-simd-threaded.jsep.wasm"
};


// ========================================
// Translation pipelines
// ========================================

let zhToEnTranslator = null;
let enToZhTranslator = null;
let speechRecognizer = null;

// Chinese → English
export async function loadZhToEn(
  onProgress = null
) {

  if (!zhToEnTranslator) {

    zhToEnTranslator = await pipeline(
      "translation",
      "opus-mt-zh-en",
      {
        dtype: "q8",
        progress_callback: onProgress
      }
    );

  }

  return zhToEnTranslator;
}


// English → Chinese
export async function loadEnToZh(
  onProgress = null
) {

  if (!enToZhTranslator) {

    enToZhTranslator = await pipeline(
      "translation",
      "opus-mt-en-zh",
      {
        dtype: "q8",
        progress_callback: onProgress
      }
    );

  }

  return enToZhTranslator;
}
export async function loadSpeechRecognizer(
  onProgress = null
) {

  if (!speechRecognizer) {

    speechRecognizer = await pipeline(
      "automatic-speech-recognition",
      "whisper-base",
      {
        dtype: "q8",
        progress_callback: onProgress
      }
    );

  }

  return speechRecognizer;
}


export async function transcribeChinese(
  audio16k,
  onProgress = null
) {

  const recognizer =
    await loadSpeechRecognizer(
      onProgress
    );


  const result =
    await recognizer(
      audio16k,
      {
        language: "zh",
        task: "transcribe",

        return_timestamps: false,

        chunk_length_s: 30,
        stride_length_s: 5
      }
    );


  return result.text.trim();
}

// ========================================
// Translation functions
// ========================================

export async function translateZhToEn(
  text,
  onProgress = null
) {

  const translator =
    await loadZhToEn(onProgress);

  const output =
    await translator(text);

  return output[0].translation_text;
}


export async function translateEnToZh(
  text,
  onProgress = null
) {

  const translator =
    await loadEnToZh(onProgress);

  const output =
    await translator(text);

  return output[0].translation_text;
}