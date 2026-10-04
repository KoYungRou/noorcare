import {
  translateZhToEn,
  translateEnToZh,
  transcribeChinese
} from "./local-ai.js";
import {
  extractPatientNote
} from "./extraction.js";
import {
  saveConfirmedVisit,
  saveFollowup,
  getVisits,
  deleteVisit,
  deleteAllVisits
} from "./storage.js";
import {
  extractPatientNoteAI
} from "./extractor-ai.js";
let currentVisit = null;

// Voice recording state
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob = null;
let recordedAudioURL = null;

const patientScreen =
  document.getElementById("patientScreen");

const clinicianScreen =
  document.getElementById("clinicianScreen");

const followupScreen =
  document.getElementById("followupScreen");

const newVisitNav =
  document.getElementById("newVisitNav");

const recordsNav =
  document.getElementById("recordsNav");

const recordsList =
  document.getElementById("recordsList");

const emptyRecords =
  document.getElementById("emptyRecords");

const recordCount =
  document.getElementById("recordCount");

const patientInput =
  document.getElementById("patientInput");

const originalText =
  document.getElementById("originalText");

const translatedText =
  document.getElementById("translatedText");

const concerns =
  document.getElementById("concerns");

const duration =
  document.getElementById("duration");

const additional =
  document.getElementById("additional");


const prepareBtn =
  document.getElementById("prepareBtn");

const backBtn =
  document.getElementById("backBtn");

const confirmBtn =
  document.getElementById("confirmBtn");

const voiceAudioPlayer =
  document.getElementById(
    "voiceAudioPlayer"
  );

const translateFollowupBtn =
  document.getElementById("translateFollowupBtn");
const connectionStatus =
  document.getElementById(
    "connectionStatus"
  );

const connectionStatusText =
  document.getElementById(
    "connectionStatusText"
  );

const deleteAllRecordsBtn =
  document.getElementById(
    "deleteAllRecordsBtn"
  );

const recordsDangerZone =
  document.getElementById(
    "recordsDangerZone"
  );
const voiceBtn =
  document.getElementById("voiceBtn");

const voiceBtnText =
  document.getElementById("voiceBtnText");

const voiceStatus =
  document.getElementById("voiceStatus");
function escapeHTML(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
function showScreen(screen, stepNumber) {

  document
    .querySelectorAll(".screen")
    .forEach(element => {
      element.classList.remove("active");
    });


  screen.classList.add("active");


  document
    .querySelectorAll(".step")
    .forEach((step, index) => {

      if (index < stepNumber) {
        step.classList.add("active");
      } else {
        step.classList.remove("active");
      }

    });

}
function renderRecords() {

  const visits =
    getVisits();


  recordCount.textContent =
    visits.length;


  if (visits.length === 0) {

  recordsList.innerHTML = "";

  emptyRecords.classList.remove(
    "hidden"
  );

  recordsDangerZone.classList.add(
    "hidden"
  );

  return;

}


  emptyRecords.classList.add(
    "hidden"
  );
  recordsDangerZone.classList.remove(
  "hidden"
  );


  recordsList.innerHTML =
    visits.map(visit => {

      const date =
        new Date(
          visit.createdAt
        ).toLocaleString();


      const followupHTML =
        visit.followup
          ? `
            <div class="record-section">

              <div class="record-section-title">
                Follow-up
              </div>

              <div class="followup-box">

                <p>
                  ${escapeHTML(
                    visit.followup.clinicianInstruction
                  )}
                </p>

                <p class="patient-language">
                  ${escapeHTML(
                    visit.followup.patientTranslation
                  )}
                </p>

                <p class="record-translation">
                  ✓ Confirmed by healthcare worker
                </p>

              </div>

            </div>
          `
          : `
            <div class="record-section">

              <div class="record-section-title">
                Follow-up
              </div>

              <p class="record-translation">
                No follow-up instruction saved.
              </p>

            </div>
          `;


      return `

        <article class="record-card">

          <div class="record-top">

            <div>

              <div class="record-id">
                Visit ${escapeHTML(visit.id)}
              </div>

              <div class="record-date">
                ${escapeHTML(date)}
              </div>

            </div>


            <div class="reviewed-badge">
              ✓ Human reviewed
            </div>

          </div>


          <div class="record-section">

            <div class="record-section-title">
              Patient statement · Mandarin Chinese
            </div>

            <p>
              ${escapeHTML(
                visit.originalStatement
              )}
            </p>

            <p class="record-translation">
              English:
              ${escapeHTML(
                visit.translation
              )}
            </p>

          </div>


          <div class="record-section">

            <div class="record-section-title">
              Confirmed note
            </div>

            <p>
              ${escapeHTML(
                visit.confirmedNote.concerns
              )}
            </p>

          </div>


          <div class="record-section">

            <div class="record-section-title">
              Duration
            </div>

            <p>
              ${escapeHTML(
                visit.confirmedNote.duration
              )}
            </p>

          </div>


          <div class="record-section">

            <div class="record-section-title">
              Additional information
            </div>

            <p>
              ${escapeHTML(
                visit.confirmedNote.additional
              )}
            </p>

          </div>


          ${followupHTML}


          <div class="record-actions">

            <button
              class="delete-record-btn"
              data-delete-visit="${escapeHTML(
                visit.id
              )}"
            >
              Delete from device
            </button>

          </div>

        </article>

      `;

    }).join("");

}
function showRecords() {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });


  recordsScreen.classList.add(
    "active"
  );


  document
    .querySelector(".steps")
    .style.display =
      "none";


  newVisitNav.classList.remove(
    "active"
  );

  recordsNav.classList.add(
    "active"
  );


  renderRecords();

}


function showNewVisit() {

  document
    .querySelector(".steps")
    .style.display =
      "flex";


  recordsNav.classList.remove(
    "active"
  );

  newVisitNav.classList.add(
    "active"
  );


  showScreen(
    patientScreen,
    1
  );

}
function updateConnectionStatus() {

  if (navigator.onLine) {

    connectionStatus.classList.remove(
      "offline"
    );

    connectionStatusText.textContent =
      "Local AI Ready";

  } else {

    connectionStatus.classList.add(
      "offline"
    );

    connectionStatusText.textContent =
      "Offline Mode";

  }

}

async function startRecording() {

  try {

    voiceStatus.textContent =
      "正在請求麥克風權限…";


    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });

    audioChunks = [];
    recordedAudioBlob = null;
    voiceReview.classList.add(
    "hidden"
    );

    voiceAudioPlayer.pause();

    voiceAudioPlayer.removeAttribute(
    "src"
    );

    voiceAudioPlayer.load();

    mediaRecorder =
      new MediaRecorder(stream);


    mediaRecorder.addEventListener(
        "dataavailable",
        event => {

            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }

        }
    );


    mediaRecorder.addEventListener(
      "stop",
      async () => {

        recordedAudioBlob =
          new Blob(
            audioChunks,
            {
              type:
                mediaRecorder.mimeType ||
                "audio/webm"
            }
          );


        // Release microphone
        stream
          .getTracks()
          .forEach(track => track.stop());


        voiceBtn.classList.remove(
          "recording"
        );

        voiceBtnText.textContent =
          "用中文說話";


        const sizeKB =
          Math.round(
            recordedAudioBlob.size / 1024
          );


        voiceStatus.textContent =
          `錄音完成 · ${sizeKB} KB`;

        if (recordedAudioURL) {
            URL.revokeObjectURL(
                recordedAudioURL
            );
            }

            recordedAudioURL =
            URL.createObjectURL(
                recordedAudioBlob
            );

            voiceAudioPlayer.src =
                recordedAudioURL;

            voiceAudioPlayer.load();

            voiceReview.classList.remove(
            "hidden"
            );

            try {

        voiceStatus.textContent =
            "正在準備語音…";


        const audio16k =
            await audioBlobTo16kFloat32(
            recordedAudioBlob
            );


        voiceStatus.textContent =
            "正在載入本機語音模型…";


        const transcript =
        await transcribeChinese(
            audio16k,
            progress => {

            if (
                progress.status === "progress" &&
                typeof progress.progress === "number"
            ) {

                voiceStatus.textContent =
                `正在準備語音模型… ${Math.round(
                    progress.progress
                )}%`;

                }

                }
        );


        if (transcript) {

        patientInput.value =
            transcript;

        voiceStatus.textContent =
            "語音辨識完成，可修改文字後再繼續。";

        } else {

        voiceStatus.textContent =
            "沒有辨識到語音，請再試一次。";

        }

        } catch (error) {

        console.error(
            "Audio processing failed:",
            error
        );

        voiceStatus.textContent =
            "語音處理失敗，請重試或直接輸入文字。";

        }

      }
    );


    mediaRecorder.start();


    voiceBtn.classList.add(
      "recording"
    );

    voiceBtnText.textContent =
      "停止錄音";

    voiceStatus.textContent =
      "正在錄音…請用中文說話";


  } catch (error) {

    console.error(
      "Microphone error:",
      error
    );


    voiceBtn.classList.remove(
      "recording"
    );

    voiceBtnText.textContent =
      "用中文說話";


    if (
      error.name === "NotAllowedError"
    ) {

      voiceStatus.textContent =
        "無法使用麥克風，請允許 NoorCare 存取麥克風。";

    } else {

      voiceStatus.textContent =
        "無法啟動麥克風。";

    }

  }

}
function stopRecording() {

  if (
    !mediaRecorder ||
    mediaRecorder.state !== "recording"
  ) {
    return;
  }


  voiceStatus.textContent =
    "正在處理錄音…";


  mediaRecorder.stop();

}
async function audioBlobTo16kFloat32(blob) {

  const arrayBuffer =
    await blob.arrayBuffer();

  const audioContext =
    new AudioContext();

  const decodedAudio =
    await audioContext.decodeAudioData(
      arrayBuffer
    );


  // Whisper expects mono audio.
  const monoData =
    decodedAudio.getChannelData(0);


  const targetSampleRate = 16000;

  const targetLength =
    Math.ceil(
      monoData.length *
      targetSampleRate /
      decodedAudio.sampleRate
    );


  const offlineContext =
    new OfflineAudioContext(
      1,
      targetLength,
      targetSampleRate
    );


  const source =
    offlineContext.createBufferSource();


  const monoBuffer =
    offlineContext.createBuffer(
      1,
      monoData.length,
      decodedAudio.sampleRate
    );


  monoBuffer
    .copyToChannel(
      monoData,
      0
    );


  source.buffer =
    monoBuffer;

  source.connect(
    offlineContext.destination
  );

  source.start(0);


  const renderedBuffer =
    await offlineContext
      .startRendering();


  const audio16k =
    renderedBuffer
      .getChannelData(0)
      .slice();


  await audioContext.close();


  return audio16k;
}

window.addEventListener(
  "online",
  updateConnectionStatus
);

window.addEventListener(
  "offline",
  updateConnectionStatus
);

updateConnectionStatus();
recordsNav.addEventListener(
  "click",
  showRecords
);

voiceBtn.addEventListener(
  "click",
  async () => {

    if (
      mediaRecorder &&
      mediaRecorder.state === "recording"
    ) {

      stopRecording();

    } else {

      await startRecording();

    }

  }
);

newVisitNav.addEventListener(
  "click",
  showNewVisit
);
recordsList.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "[data-delete-visit]"
      );


    if (!button) {
      return;
    }


    const visitId =
      button.dataset.deleteVisit;


    const confirmed =
      window.confirm(
        `Delete ${visitId} from this device?\n\nThis cannot be undone.`
      );


    if (!confirmed) {
      return;
    }


    deleteVisit(
      visitId
    );


    renderRecords();

  }
);
deleteAllRecordsBtn.addEventListener(
  "click",
  () => {

    const visits =
      getVisits();


    if (visits.length === 0) {
      return;
    }


    const confirmed =
      window.confirm(
        "Delete ALL NoorCare records from this device?\n\n" +
        "This permanently removes all confirmed visits " +
        "stored in this browser and cannot be undone."
      );


    if (!confirmed) {
      return;
    }


    deleteAllVisits();

    currentVisit = null;

    renderRecords();

  }
);

prepareBtn.addEventListener("click", async () => {

  const text =
    patientInput.value.trim();

  if (!text) {
    alert("請先輸入患者描述。");
    return;
  }


  try {

    prepareBtn.disabled = true;
    prepareBtn.textContent =
      "Loading local translation model...";


    const translation =
      await translateZhToEn(
        text,
        (progress) => {

          if (
            progress.status === "progress" &&
            progress.progress
          ) {

            prepareBtn.textContent =
              `Downloading model ${Math.round(progress.progress)}%`;

          }

        }
      );


    originalText.textContent =
      text;

    translatedText.textContent =
      translation;


  // Local AI structured extraction with rule-based fallback
    let note;

    try {

    note =
        await extractPatientNoteAI(
        translation
        );

    } catch (error) {

    console.error(
        "Local AI extraction failed. Using fallback:",
        error
    );

    note =
        extractPatientNote(
        translation
        );

    }

    concerns.value =
        note.concerns;

    duration.value =
        note.duration;

    additional.value =
        note.additional;


    showScreen(
      clinicianScreen,
      2
    );


  } catch (error) {

    console.error(error);

    alert(
      "Local translation model could not be loaded. Check the browser console."
    );

  } finally {

    prepareBtn.disabled = false;

    prepareBtn.textContent =
      "Translate & Prepare Note";

  }

});


backBtn.addEventListener("click", () => {

  showScreen(
    patientScreen,
    1
  );

});


confirmBtn.addEventListener("click", () => {

  try {

    currentVisit =
      saveConfirmedVisit({

        originalStatement:
          originalText.textContent,

        translation:
          translatedText.textContent,

        concerns:
          concerns.value.trim(),

        duration:
          duration.value.trim(),

        additional:
          additional.value.trim()

      });

    document
    .getElementById("visitBadge")
    .textContent =
        `Visit ${currentVisit.id} · ✓ Human reviewed · 🔒 Stored locally`;

    showScreen(
      followupScreen,
      3
    );


  } catch (error) {

    console.error(error);

    alert(
      "The confirmed note could not be saved locally."
    );

  }

});


translateFollowupBtn.addEventListener(
  "click",
  async () => {

    const input =
      document
        .getElementById("followupInput")
        .value
        .trim();


    if (!input) {

      alert(
        "Please enter follow-up instructions."
      );

      return;

    }


    try {

      translateFollowupBtn.disabled = true;

      translateFollowupBtn.textContent =
        "Loading translation model...";


      const translation =
        await translateEnToZh(
          input,
          (progress) => {

            if (
              progress.status === "progress" &&
              progress.progress
            ) {

              translateFollowupBtn.textContent =
                `Downloading model ${Math.round(progress.progress)}%`;

            }

          }
        );
      if (!currentVisit) {
        throw new Error(
          "No confirmed visit is active."
        );
      }

      currentVisit =
        saveFollowup(
          currentVisit.id,
          input,
          translation
        );


      document
        .getElementById("followupTranslation")
        .textContent =
          translation;


      document
        .getElementById("patientResult")
        .classList
        .remove("hidden");


    } catch (error) {

      console.error(error);

      alert(
        "Translation failed. Check the browser console."
      );

    } finally {

      translateFollowupBtn.disabled = false;

      translateFollowupBtn.textContent =
        "Translate for Patient";

    }

  }
  
);
recordCount.textContent =
  getVisits().length;
if ("serviceWorker" in navigator) {

  window.addEventListener(
    "load",
    async () => {

      try {

        const registration =
          await navigator.serviceWorker.register(
            "/sw.js"
          );

        console.log(
          "NoorCare service worker registered:",
          registration.scope
        );

      } catch (error) {

        console.error(
          "Service worker registration failed:",
          error
        );

      }

    }
  );

}
