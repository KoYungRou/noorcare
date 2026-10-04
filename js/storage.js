const STORAGE_KEY = "noorcare_visits_v1";


function loadVisits() {

  try {

    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    return JSON.parse(raw);

  } catch (error) {

    console.error(
      "Could not read NoorCare records:",
      error
    );

    return [];

  }

}


function writeVisits(visits) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(visits)
  );

}


function createVisitId() {

  const timestamp =
    Date.now()
      .toString()
      .slice(-8);

  return `NC-${timestamp}`;

}


export function saveConfirmedVisit(data) {

  const visits =
    loadVisits();


  const visit = {

    id: createVisitId(),

    createdAt:
      new Date().toISOString(),

    patientLanguage:
      "Mandarin Chinese",

    clinicianLanguage:
      "English",

    originalStatement:
      data.originalStatement,

    translation:
      data.translation,

    confirmedNote: {

      concerns:
        data.concerns,

      duration:
        data.duration,

      additional:
        data.additional

    },

    followup: null,

    humanReviewed: true,

    status:
      "confirmed"

  };


  visits.unshift(visit);

  writeVisits(visits);

  return visit;

}


export function saveFollowup(
  visitId,
  englishInstruction,
  chineseTranslation
) {

  const visits =
    loadVisits();


  const visit =
    visits.find(
      item => item.id === visitId
    );


  if (!visit) {

    throw new Error(
      "Confirmed visit could not be found."
    );

  }


  visit.followup = {

    clinicianInstruction:
      englishInstruction,

    patientTranslation:
      chineseTranslation,

    confirmedByHealthcareWorker:
      true,

    createdAt:
      new Date().toISOString()

  };


  writeVisits(visits);

  return visit;

}


export function getVisits() {

  return loadVisits();

}


export function getVisit(id) {

  return loadVisits().find(
    visit => visit.id === id
  );
  

}


export function deleteVisit(id) {

  const visits =
    loadVisits().filter(
      visit => visit.id !== id
    );

  writeVisits(visits);

}


export function deleteAllVisits() {

  localStorage.removeItem(
    STORAGE_KEY
  );

}