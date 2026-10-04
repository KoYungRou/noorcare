// Local structured extraction for the NoorCare prototype.
//
// IMPORTANT:
// This module extracts only explicitly reported information.
// It does NOT diagnose, infer diseases, or recommend treatment.


const CONCERN_PATTERNS = [
  {
    label: "Headache",
    patterns: [
      /\bheadache\b/i,
      /\bheadaches\b/i,
      /\bhead pain\b/i
    ]
  },

  {
    label: "Fatigue",
    patterns: [
      /\btired\b/i,
      /\bfatigue\b/i,
      /\bexhausted\b/i
    ]
  },

  {
    label: "Fever",
    patterns: [
      /\bfever\b/i,
      /\bfeverish\b/i
    ]
  },

  {
    label: "Cough",
    patterns: [
      /\bcough\b/i,
      /\bcoughing\b/i
    ]
  },

  {
    label: "Nausea",
    patterns: [
      /\bnausea\b/i,
      /\bnauseous\b/i
    ]
  },

  {
    label: "Vomiting",
    patterns: [
      /\bvomit\b/i,
      /\bvomiting\b/i,
      /\bthrew up\b/i
    ]
  },

  {
    label: "Dizziness",
    patterns: [
      /\bdizzy\b/i,
      /\bdizziness\b/i,
      /\blightheaded\b/i
    ]
  },

  {
    label: "Sore throat",
    patterns: [
      /\bsore throat\b/i
    ]
  }
];


// --------------------------------------------------
// Detect reported concerns
// --------------------------------------------------

function detectConcerns(text) {

  const concerns = [];

  for (const concern of CONCERN_PATTERNS) {

    const found =
      concern.patterns.some(pattern =>
        pattern.test(text)
      );

    if (found) {
      concerns.push(concern.label);
    }

  }

  return concerns;
}


// --------------------------------------------------
// Detect time expressions
// --------------------------------------------------

function detectTimeExpressions(text) {

  const expressions = [];

  let match;


  // Examples:
  // for three days
  // for 2 weeks
  // for one month

  const durationRegex =
    /\bfor\s+((?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:hour|hours|day|days|week|weeks|month|months))\b/gi;


  while (
    (match = durationRegex.exec(text)) !== null
  ) {

    expressions.push({
      value: match[1],
      raw: match[0],
      index: match.index
    });

  }


  // Examples:
  // since this morning
  // since last night
  // since yesterday

  const sinceRegex =
    /\bsince\s+(this morning|this afternoon|this evening|last night|yesterday|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;


  while (
    (match = sinceRegex.exec(text)) !== null
  ) {

    expressions.push({
      value: `since ${match[1]}`,
      raw: match[0],
      index: match.index
    });

  }


  return expressions;
}


// --------------------------------------------------
// Find where each concern appears in the text
// --------------------------------------------------

function findConcernOccurrences(
  text,
  concernLabel
) {

  const concern =
    CONCERN_PATTERNS.find(
      item =>
        item.label === concernLabel
    );


  if (!concern) {
    return [];
  }


  const occurrences = [];


  for (const pattern of concern.patterns) {

    const flags =
      pattern.flags.includes("g")
        ? pattern.flags
        : pattern.flags + "g";


    const globalPattern =
      new RegExp(
        pattern.source,
        flags
      );


    let match;


    while (
      (match = globalPattern.exec(text)) !== null
    ) {

      occurrences.push({
        index: match.index,
        text: match[0]
      });

    }

  }


  return occurrences.sort(
    (a, b) =>
      a.index - b.index
  );
}


// --------------------------------------------------
// Associate time expressions with concerns
// --------------------------------------------------

function buildDurationNotes(
  text,
  concerns,
  timeExpressions
) {

  const notes = [];


  for (const concern of concerns) {

    let duration =
      "not specified";


    const occurrences =
      findConcernOccurrences(
        text,
        concern
      );


    if (
      occurrences.length > 0 &&
      timeExpressions.length > 0
    ) {

      const concernPosition =
        occurrences[0].index;


      /*
        Conservative association rule:

        Find a time expression close to the concern.

        This does NOT invent duration.
        It only associates an explicitly reported
        time expression with a nearby concern.
      */

      const candidates =
        timeExpressions
          .map(time => {

            const distance =
              Math.abs(
                time.index -
                concernPosition
              );


            return {
              ...time,
              distance
            };

          })
          .filter(
            time =>
              time.distance <= 80
          )
          .sort(
            (a, b) =>
              a.distance - b.distance
          );


      if (candidates.length > 0) {

        duration =
          candidates[0].value;

      }

    }


    notes.push(
      `• ${concern} — ${duration}`
    );

  }


  return notes;
}


// --------------------------------------------------
// Main extraction
// --------------------------------------------------

export function extractPatientNote(
  translatedText
) {

  const concerns =
    detectConcerns(
      translatedText
    );


  const timeExpressions =
    detectTimeExpressions(
      translatedText
    );


  const concernText =
    concerns.length > 0
      ? concerns
          .map(
            item =>
              `• ${item}`
          )
          .join("\n")
      : "No supported concern could be extracted automatically.";


  const durationNotes =
    buildDurationNotes(
      translatedText,
      concerns,
      timeExpressions
    );


  const durationText =
    durationNotes.length > 0
      ? durationNotes.join("\n")
      : "Not specified";


  return {

    concerns:
      concernText,

    duration:
      durationText,

    additional:
      "None extracted automatically",

    needsReview:
      true

  };

}