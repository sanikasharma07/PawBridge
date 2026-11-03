// Emergency case display helpers. The backend stores species and the
// description inside `animalInfo` (see EmergencyCase model), not as
// top-level fields — the report endpoint accepts top-level
// species/quickDescription in the request and nests them on save.
// Read through this helper so display code never shows a blank title.
export function caseSpecies(c) {
  return c?.animalInfo?.species || c?.species || 'Animal'
}
export function caseDescription(c) {
  return c?.animalInfo?.quickDescription || c?.quickDescription || ''
}
