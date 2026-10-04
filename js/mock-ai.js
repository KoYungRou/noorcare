const MockAI = {

  preparePatientNote(text) {

    const demoText =
      "我頭痛已經三天了，昨天晚上開始發燒。";

    if (text.trim() === demoText) {

      return {

        translation:
          "I have had a headache for three days and developed a fever last night.",

        concerns:
          "• Headache\n• Fever",

        duration:
          "• Headache — 3 days\n• Fever — since last night",

        additional:
          "None reported"

      };

    }


    return {

      translation:
        "[Prototype translation] " + text,

      concerns:
        "Needs clinician review",

      duration:
        "Not clearly identified",

      additional:
        "AI extraction unavailable for this prototype input"

    };

  },


  translateFollowup(text) {

    const normalized =
      text.trim().toLowerCase();


    if (
      normalized.includes("return") &&
      normalized.includes("next tuesday")
    ) {

      return "請在下週二回診。";

    }


    return "[Prototype translation] " + text;

  }

};