# NoorCare

**Offline-first AI communication support for multilingual healthcare
settings.**

NoorCare is a browser-based prototype designed to help Mandarin-speaking
patients communicate patient-reported information to English-speaking
healthcare workers in settings where internet connectivity may be
limited or unavailable.

Instead of relying on cloud AI APIs, NoorCare runs its core AI pipeline
locally on the device: speech recognition, translation, and structured
information extraction. The resulting note is always presented for human
review before it can be confirmed.

> **Challenge:** World Bank --- Small AI for Development\
> **Track:** Track A: Health

------------------------------------------------------------------------

## Why NoorCare?

Language barriers can make basic healthcare communication slower and
harder, especially in settings where professional interpretation or
reliable internet access is not consistently available.

Many AI-assisted communication tools also depend on cloud services. That
creates a practical limitation in low-connectivity environments and can
require sensitive patient-reported text to leave the device.

NoorCare explores a different approach:

-   small, locally executed AI models;
-   offline-capable browser deployment;
-   patient-to-clinician translation;
-   structured organization of explicitly reported information;
-   mandatory human review; and
-   local storage for confirmed prototype records.

NoorCare is **not a diagnostic system**. It does not diagnose
conditions, infer diseases, or recommend treatment.

------------------------------------------------------------------------

## How NoorCare Works

``` mermaid
flowchart LR
    A["Patient speaks or types<br/>in Mandarin"] --> B["Whisper Base<br/>Local Speech Recognition"]
    B --> C["Mandarin Text"]
    C --> D["MarianMT<br/>Local Translation"]
    D --> E["English Translation"]
    E --> F["Qwen 2.5 0.5B<br/>Local Structured Extraction"]
    F --> G["AI-Prepared Note"]
    G --> H["Clinician Review<br/>& Confirmation"]
    H --> I["Patient Follow-up"]
    H --> J["Local Visit Record"]
    I --> K["MarianMT<br/>English → Chinese"]
    K --> L["Patient-Language Instructions"]
```

Patients can either type their message or record Mandarin speech.
NoorCare transcribes speech locally, translates the resulting text into
English, and uses a small local language model to organize explicitly
reported concerns and their associated duration or onset.

The generated note is editable and must be reviewed by a healthcare
worker before confirmation.

------------------------------------------------------------------------

## Key Features

### 🎤 Local Mandarin speech recognition

Patients can record Mandarin speech directly in the browser. NoorCare
uses **Whisper Base** locally to convert the recording into editable
text.

The recorded audio can also be replayed before continuing.

### 🌐 Local Chinese ↔ English translation

NoorCare uses **MarianMT** models for local translation:

-   Mandarin Chinese → English for clinician review
-   English → Chinese for patient follow-up instructions

### 🧠 Local structured information extraction

After translation, **Qwen 2.5 0.5B** extracts explicitly reported
information into a simple reviewable structure, including:

-   reported concerns;
-   duration or onset associated with each concern; and
-   additional explicitly reported information when available.

The extraction prompt is intentionally conservative. It instructs the
model not to diagnose, infer medical conditions, recommend treatment,
invent missing information, or reinterpret reported durations.

A rule-based extractor remains available as a fallback if local AI
extraction fails.

### 👩‍⚕️ Human review required

AI-generated information is never treated as a confirmed clinical record
automatically.

The healthcare worker can review and edit the prepared note before
confirming it.

### 📝 Patient follow-up

After clinician confirmation, a healthcare worker can enter follow-up
instructions in English and translate them locally into Chinese for the
patient.

### 📋 Local visit records

Clinician-confirmed visits can be stored locally in the browser and
reviewed from the Records screen.

Records can be deleted individually or cleared from the device.

### 📴 Offline-first operation

Once the required application and model assets have been cached on the
device, NoorCare can perform its core workflow without an active
internet connection.

------------------------------------------------------------------------

## Technical Architecture

``` mermaid
flowchart TB
    subgraph Device["User Device / Browser"]
        UI["NoorCare Web UI"]

        Audio["Microphone / Typed Input"]
        Whisper["Whisper Base<br/>Speech-to-Text"]
        MarianZHEN["MarianMT<br/>Chinese → English"]
        Qwen["Qwen 2.5 0.5B<br/>Structured Extraction"]
        Review["Human Review Layer"]
        MarianENZH["MarianMT<br/>English → Chinese"]
        Storage["Browser Local Storage"]
        SW["Service Worker + Cache Storage"]

        Audio --> UI
        UI --> Whisper
        Whisper --> UI
        UI --> MarianZHEN
        MarianZHEN --> Qwen
        Qwen --> Review
        Review --> Storage
        Review --> MarianENZH
        MarianENZH --> UI

        SW -. "cached model assets" .-> Whisper
        SW -. "cached model assets" .-> MarianZHEN
        SW -. "cached model assets" .-> MarianENZH
        SW -. "cached model assets" .-> Qwen
    end

    Cloud["Internet / Cloud Services"]
    Cloud -. "not required for cached inference" .-> Device
```

NoorCare uses Transformers.js-compatible local model assets and ONNX
inference in the browser. A Service Worker and browser Cache Storage
make the application shell and required model assets available for
offline use after they have been loaded and cached.

The prototype has been tested using a cold-start offline workflow: the
browser was switched offline, the application was reloaded, and the
speech → translation → structured extraction workflow completed using
locally cached resources.

------------------------------------------------------------------------

## Local AI Stack

  -----------------------------------------------------------------------
  Task                    Model                   Purpose
  ----------------------- ----------------------- -----------------------
  Speech recognition      Whisper Base            Mandarin speech → text

  Translation             MarianMT / OPUS-MT      Chinese ↔ English

  Structured extraction   Qwen 2.5 0.5B           Patient-reported
                                                  concerns and
                                                  duration/onset
  -----------------------------------------------------------------------

The project deliberately uses relatively small models that can run
locally rather than depending on a remote generative AI API.

------------------------------------------------------------------------

## Safety by Design

NoorCare is designed as **documentation and communication assistance**,
not autonomous clinical decision-making.

The prototype follows several constraints:

-   **No diagnosis:** NoorCare does not determine what disease or
    condition a patient has.
-   **No treatment recommendation:** the AI does not prescribe or
    recommend treatment.
-   **Explicit information only:** structured extraction is instructed
    to use only information reported in the patient's statement.
-   **No invented duration:** if a duration or onset is not stated, it
    should be marked as not specified.
-   **Human review:** generated notes must be reviewed before
    confirmation.
-   **Editable output:** healthcare workers can correct the prepared
    note before saving it.

AI output can still be incorrect. Human review remains essential.

------------------------------------------------------------------------

## Privacy and Local Processing

NoorCare's core AI processing is designed to run on the user's device.

For the demonstrated local workflow:

-   speech recognition runs locally;
-   translation runs locally;
-   structured extraction runs locally; and
-   confirmed prototype records are stored in the browser.

No cloud AI service is required for cached inference.

### Prototype privacy limitation

The current prototype does **not** provide production-grade encryption,
authentication, access control, or secure clinical record storage.

Browser-local records may be accessible to other people who can access
the same browser profile or device. NoorCare should therefore be treated
as a prototype and **not as a production medical record system**.

------------------------------------------------------------------------

## Offline Architecture

NoorCare uses a Service Worker to support offline operation.

The application shell includes resources such as:

``` text
/index.html
/css/app.css
/js/app.js
/js/local-ai.js
/js/extraction.js
/js/extractor-ai.js
/js/storage.js
/manifest.json
```

AI model resources are cached locally after successful loading,
including assets required by Whisper, MarianMT, and Qwen.

Conceptually:

``` text
First use with model assets available
        ↓
Browser loads NoorCare + local model files
        ↓
Service Worker stores successful same-origin resources
        ↓
Cache Storage
        ↓
Later offline session
        ↓
NoorCare reloads from local cache
        ↓
Local AI inference continues without cloud AI
```

Large model files are not treated as mandatory application-shell files
during Service Worker installation. They are cached after successful
retrieval, reducing the risk that a single large model download prevents
the Service Worker from installing.

------------------------------------------------------------------------

## Running NoorCare Locally

### Requirements

You need:

-   a modern browser with JavaScript modules, Web Audio, MediaRecorder,
    Service Worker, and WebAssembly support;
-   a local HTTP server;
-   the project's local model assets in the expected `/models/`
    directories; and
-   the project's JavaScript dependencies installed.

### 1. Clone the repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd noorcare
```

### 2. Install dependencies

If the repository includes `package.json`, install its dependencies
using the package manager used by the project:

``` bash
npm install
```

### 3. Verify local model assets

The prototype expects local model directories for the AI pipeline. The
exact repository packaging strategy may vary because model binaries can
be large.

Typical structure:

``` text
models/
├── whisper-base/
├── opus-mt-zh-en/
├── opus-mt-en-zh/
└── qwen-extractor/
```

For Qwen, the local directory includes tokenizer/configuration assets
and the quantized ONNX model, for example:

``` text
models/qwen-extractor/
├── config.json
├── generation_config.json
├── merges.txt
├── tokenizer.json
├── tokenizer_config.json
├── vocab.json
└── onnx/
    └── model_q4.onnx
```

> If large model files are not committed to the Git repository, follow
> the model setup instructions supplied with the repository before
> launching NoorCare.

### 4. Start a local server

For example:

``` bash
python3 -m http.server 8000
```

Then open:

``` text
http://localhost:8000
```

Do not open `index.html` directly with a `file://` URL. Service Workers
and browser module behavior require an HTTP(S) context.

------------------------------------------------------------------------

## Using NoorCare Offline

For a fresh installation:

1.  Start NoorCare while the required model assets are locally
    available.
2.  Allow the application to load the models needed for speech
    recognition, translation, and structured extraction.
3.  Complete at least one successful workflow so the required resources
    can be cached.
4.  Confirm that the Service Worker is active.
5.  The application can then be reloaded and used without an active
    network connection, provided the browser cache has not been cleared.

Clearing site data, Cache Storage, or the browser profile may remove
resources required for offline operation.

------------------------------------------------------------------------

## Project Structure

A simplified view of the prototype:

``` text
noorcare/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   ├── local-ai.js
│   ├── extractor-ai.js
│   ├── extraction.js
│   └── storage.js
├── models/
│   ├── whisper-base/
│   ├── opus-mt-zh-en/
│   ├── opus-mt-en-zh/
│   └── qwen-extractor/
├── vendor/
│   └── onnx/
└── node_modules/
    └── @huggingface/
        └── transformers/
```

### Important modules

**`js/app.js`**\
Controls the user workflow, voice recording, translation/extraction
orchestration, clinician review, follow-up, records, and Service Worker
registration.

**`js/local-ai.js`**\
Loads and runs the local speech-recognition and translation pipelines.

**`js/extractor-ai.js`**\
Runs local Qwen structured extraction and converts model JSON output
into NoorCare's reviewable note format.

**`js/extraction.js`**\
Provides conservative rule-based structured extraction as a fallback.

**`js/storage.js`**\
Handles locally stored confirmed visit and follow-up records.

**`sw.js`**\
Provides the application's offline caching behavior.

------------------------------------------------------------------------

## Human-in-the-Loop Workflow

NoorCare intentionally separates **AI preparation** from **human
confirmation**.

``` mermaid
flowchart LR
    A["Patient-reported information"] --> B["Local AI preparation"]
    B --> C["Editable draft"]
    C --> D{"Healthcare worker review"}
    D -->|"Correct / edit"| C
    D -->|"Confirm"| E["Confirmed local record"]
```

This design keeps the healthcare worker responsible for the final
documented information rather than treating model output as
authoritative.

------------------------------------------------------------------------

## Current Prototype Limitations

NoorCare is an early prototype and has important limitations:

-   Speech recognition can mis-transcribe words, numbers, or durations.
-   Translation can lose nuance or use non-clinical phrasing.
-   Structured extraction can omit, misassociate, or incorrectly format
    information.
-   The current language workflow focuses on Mandarin Chinese and
    English.
-   Browser-local records are not encrypted.
-   There is no user authentication or role-based access control.
-   The prototype is not integrated with an electronic health record
    system.
-   Cached models require significant local storage.
-   Initial model preparation may require time and sufficient device
    resources.
-   Performance depends on the user's browser and hardware.
-   The prototype has not been clinically validated.
-   It is not intended for emergency use or autonomous medical
    decision-making.

These limitations are why NoorCare keeps a human reviewer in the
workflow.

------------------------------------------------------------------------

## Why Small AI for Development?

NoorCare is built around a simple premise:

> Useful healthcare AI should not always require a powerful cloud
> connection.

The project explores how smaller, task-focused models can be combined
locally to support a practical healthcare communication workflow:

``` text
small speech model
        +
small translation models
        +
small language model
        +
human oversight
        =
offline-capable communication assistance
```

This approach is relevant to environments where connectivity, cloud
access, cost, infrastructure, or privacy constraints can make
cloud-dependent AI difficult to use reliably.

Rather than asking one large model to perform every task, NoorCare uses
specialized components for speech recognition and translation, plus a
small language model for constrained structured extraction.

------------------------------------------------------------------------

## Challenge Alignment

### World Bank --- Small AI for Development

**Track A: Health**

NoorCare addresses the challenge through four design priorities:

**1. Local capability**\
Core AI inference can run on the user's device after model assets are
available locally.

**2. Connectivity resilience**\
The demonstrated workflow can continue when the browser is offline using
locally cached application and model resources.

**3. Small, task-focused AI**\
NoorCare combines smaller models with clearly separated responsibilities
rather than relying on a remote general-purpose AI service.

**4. Human-centered healthcare use**\
AI prepares information for review; it does not replace the healthcare
worker's judgment.

------------------------------------------------------------------------

## Demo Workflow

A concise demonstration of NoorCare:

1.  Switch the application to an offline environment.
2.  Record a Mandarin patient statement.
3.  Whisper Base transcribes the speech locally.
4.  The patient can review or edit the transcription.
5.  MarianMT translates the statement into English locally.
6.  Qwen extracts reported concerns and associated duration/onset
    locally.
7.  The healthcare worker reviews and edits the AI-prepared note.
8.  The healthcare worker confirms the note.
9.  Follow-up instructions can be translated back into Chinese.
10. The confirmed visit is available in local visit history.

------------------------------------------------------------------------

## Repository and Live Demo

**GitHub:** `<YOUR_GITHUB_REPOSITORY_URL>`

**Live project:** `<YOUR_LIVE_PROJECT_URL>`

Replace these placeholders before submission.

------------------------------------------------------------------------

## Team

**Project:** NoorCare

Add the team members, roles, and a short description here before
submission.

Example:

``` text
Name — Product / Engineering / Design
Name — Research / Healthcare / Engineering
```

------------------------------------------------------------------------

## Model and Dependency Attribution

NoorCare uses open-source AI tooling and locally stored model assets,
including components from the Hugging Face ecosystem.

Before distributing or submitting packaged model binaries, verify and
document the exact model repositories, versions/revisions, licenses, and
required attribution notices used by the final build.

The final repository should include exact references for:

-   Whisper Base model source and license;
-   Chinese → English MarianMT / OPUS-MT model source and license;
-   English → Chinese MarianMT / OPUS-MT model source and license;
-   Qwen 2.5 0.5B model source and license;
-   Transformers.js version and license; and
-   ONNX Runtime Web or other runtime dependencies used by the project.

Do not assume that the application's own license automatically applies
to third-party model weights.

------------------------------------------------------------------------

## Disclaimer

NoorCare is a prototype for communication and documentation assistance.

It is **not a medical device, diagnostic system, emergency service, or
substitute for professional medical judgment or qualified interpretation
services**.

AI-generated transcription, translation, and structured information may
contain errors. Healthcare workers must independently review information
before relying on or confirming it.

------------------------------------------------------------------------

## Status

**Prototype --- Hackathon / Challenge Submission**

Core demonstrated capabilities:

-   [x] Mandarin text input
-   [x] Mandarin voice input
-   [x] Local Whisper Base speech recognition
-   [x] Local Chinese → English translation
-   [x] Local Qwen structured extraction
-   [x] Multi-concern duration/onset extraction
-   [x] Human review and confirmation
-   [x] English → Chinese follow-up translation
-   [x] Local visit history
-   [x] Offline application loading
-   [x] Offline speech → translation → extraction workflow

------------------------------------------------------------------------

**NoorCare --- local AI for communication when connectivity cannot be
assumed.**
