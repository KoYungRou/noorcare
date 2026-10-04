import {
  mkdir,
  access
} from "node:fs/promises";

import {
  dirname,
  join
} from "node:path";

import {
  fileURLToPath
} from "node:url";


const ROOT =
  join(
    dirname(fileURLToPath(import.meta.url)),
    ".."
  );


const MODELS = [
  {
    name: "Whisper Base",
    repo: "Xenova/whisper-base",
    revision:
      "64da57285918e20ea79ea5c88eed7197933abaa8",

    files: [
      "onnx/encoder_model_quantized.onnx",
      "onnx/decoder_model_merged_quantized.onnx"
    ],

    destination:
      "models/whisper-base"
  },

  {
    name: "MarianMT Chinese → English",
    repo: "Xenova/opus-mt-zh-en",
    revision:
      "39d480d52a9ea3065a1f117adfe4dbc55de10e6f",

    files: [
      "onnx/encoder_model_quantized.onnx",
      "onnx/decoder_model_merged_quantized.onnx"
    ],

    destination:
      "models/opus-mt-zh-en"
  },

  {
    name: "MarianMT English → Chinese",
    repo: "Xenova/opus-mt-en-zh",
    revision:
      "046f55aec303cdee3e0318604406d4df20f1e8ea",

    files: [
      "onnx/encoder_model_quantized.onnx",
      "onnx/decoder_model_merged_quantized.onnx"
    ],

    destination:
      "models/opus-mt-en-zh"
  },

  {
    name: "Qwen 2.5 0.5B",
    repo:
      "onnx-community/Qwen2.5-0.5B-Instruct",

    revision:
      "cc5cc01a65cc3ff17bdb73a7de33d879f62599b0",

    files: [
      "onnx/model_q4.onnx"
    ],

    destination:
      "models/qwen-extractor"
  }
];


async function exists(path) {

  try {

    await access(path);

    return true;

  } catch {

    return false;

  }

}


async function downloadFile(
  repo,
  revision,
  remoteFile,
  localFile
) {

  const url =
    `https://huggingface.co/${repo}/resolve/${revision}/${remoteFile}`;

  await mkdir(
    dirname(localFile),
    {
      recursive: true
    }
  );


  console.log(
    `  ↓ ${remoteFile}`
  );


  const response =
    await fetch(url, {
      redirect: "follow"
    });


  if (!response.ok) {

    throw new Error(
      `Download failed (${response.status}): ${url}`
    );

  }


  const arrayBuffer =
    await response.arrayBuffer();


  const {
    writeFile
  } =
    await import("node:fs/promises");


  await writeFile(
    localFile,
    Buffer.from(arrayBuffer)
  );

}


async function setupModel(model) {

  console.log(
    `\n${model.name}`
  );


  for (
    const remoteFile
    of model.files
  ) {

    const localFile =
      join(
        ROOT,
        model.destination,
        remoteFile
      );


    if (
      await exists(localFile)
    ) {

      console.log(
        `  ✓ ${remoteFile}`
      );

      continue;

    }


    await downloadFile(
      model.repo,
      model.revision,
      remoteFile,
      localFile
    );


    console.log(
      `  ✓ downloaded ${remoteFile}`
    );

  }

}


async function main() {

  console.log(
    "\nSetting up NoorCare local AI models..."
  );


  for (
    const model
    of MODELS
  ) {

    await setupModel(model);

  }


  console.log(
    "\n✓ NoorCare models are ready.\n"
  );

}


main().catch(error => {

  console.error(
    "\nModel setup failed:"
  );

  console.error(error);

  process.exit(1);

});