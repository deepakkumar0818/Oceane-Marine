/**
 * Revision number logic for STS checklist forms:
 * - New form created → 1.0, next new form → 2.0, then 3.0, ...
 * - Edit existing form → 1.0 → 1.1 → 1.2, 2.0 → 2.1, ...
 * @param {import('mongoose').Model} Model - Mongoose model for the form collection
 * @returns {Promise<string>} e.g. "1.0", "2.0"
 */
export async function getNextRevisionForCreate(Model) {
  const count = await Model.countDocuments();
  const major = count + 1;
  return `${major}.0`;
}

/**
 * Increment revision minor for an update (edit): 1.0 → 1.1, 1.1 → 1.2
 * @param {string} currentRevisionNo - e.g. "1.0", "1.2", "2.0"
 * @returns {string} e.g. "1.1", "1.3", "2.1"
 */
export function incrementRevisionForUpdate(currentRevisionNo) {
  if (!currentRevisionNo || typeof currentRevisionNo !== "string") {
    return "1.1";
  }
  const trimmed = currentRevisionNo.trim();
  const parts = trimmed.split(".");
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  if (Number.isNaN(major) || major < 1) {
    return "1.1";
  }
  const nextMinor = Number.isNaN(minor) || minor < 0 ? 1 : minor + 1;
  return `${major}.${nextMinor}`;
}
