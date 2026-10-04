import {
  pipeline,
  env
} from "../node_modules/@huggingface/transformers/dist/transformers.min.js";

// Only use local model files
env.allowRemoteModels = false;

env.localModelPath = "/models/";


let extractor = null;


async function loadExtractor() {

  if (extractor) {
    return extractor;
  }


  console.log(
    "Loading NoorCare local extraction AI..."
  );


  extractor = await pipeline(
    "text-generation",
    "qwen-extractor",
    {
      dtype: "q4"
    }
  );


  console.log(
    "NoorCare extraction AI ready."
  );


  return extractor;
}


export async function extractPatientNoteAI(
  translatedText
) {

  const model =
    await loadExtractor();


  const messages = [
    {
      role: "system",
      content: `
You are a structured information extraction system for patient-reported text.

Extract only information explicitly stated in the input.

STRICT RULES:
1. Do not diagnose or infer a medical condition.
2. Do not recommend treatment.
3. Do not add information that is not explicitly stated.
4. Do not summarize or reinterpret duration or onset.
5. Preserve duration/onset wording from the input as closely as possible.
6. Keep the concern description separate from duration/onset.
7. If duration/onset is not stated for a concern, use "not specified".
8. Do not calculate dates or convert relative time expressions.
9. Return valid JSON only.
10. Do not include markdown or explanation.

Required JSON format:

{
  "concerns": [
    {
      "description": "explicit patient-reported concern",
      "duration": "explicit duration/onset or not specified"
    }
  ],
  "additional": []
}

Example input:
I've felt sore in my arm since last Wednesday.

Example output:
{
  "concerns": [
    {
      "description": "sore in my arm",
      "duration": "since last Wednesday"
    }
  ],
  "additional": []
}
`
    },

    {
      role: "user",
      content: translatedText
    }
  ];


  const result =
    await model(
      messages,
      {
        max_new_tokens: 120,
        do_sample: false
      }
    );


  const answer =
  result?.[0]?.generated_text?.at(-1)?.content;

  

  if (!answer) {
    throw new Error(
        "Extraction model returned no answer."
    );
  }


  // Remove accidental Markdown fences if the model adds them
  const cleaned =
    answer
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();


  let parsed;

  try {

    parsed =
        JSON.parse(cleaned);

  } catch (error) {

    console.error(
        "Could not parse extraction JSON:",
        cleaned
    );

    throw new Error(
        "Extraction model returned invalid JSON."
    );

  }


  const extractedConcerns =
    Array.isArray(parsed.concerns)
        ? parsed.concerns
        : [];


  const concernText =
    extractedConcerns.length > 0
        ? extractedConcerns
            .map(item =>
            `• ${item.description}`
            )
            .join("\n")
        : "No concern extracted automatically.";


  const durationText =
    extractedConcerns.length > 0
        ? extractedConcerns
            .map(item =>
            `• ${item.description} — ${
                item.duration ||
                "not specified"
            }`
            )
            .join("\n")
        : "Not specified";


  const additionalItems =
    Array.isArray(parsed.additional)
        ? parsed.additional
        : [];


  return {

    concerns:
        concernText,

    duration:
        durationText,

    additional:
        additionalItems.length > 0
        ? additionalItems
            .map(item => `• ${item}`)
            .join("\n")
        : "None extracted automatically",

    needsReview:
        true

    };
    }