/**
 * Paper supply, not submission scheduling. Keep an ample source-witnessed
 * manuscript inventory independently of each publication channel's capacity.
 * The owning Science corpus/Work contains the actual manuscripts; this pure
 * authoring projection creates NO parallel store, DOI, release or permission.
 */
import { planResearchPaperDraft, researchPaperProfiles } from "./research-paper-authoring.mjs";

const isRecord = x => x !== null && typeof x === "object" && !Array.isArray(x);
const text = (x, label) => {
  if (typeof x !== "string" || !x.trim()) throw new TypeError(`${label} must be nonempty text`);
  return x;
};
const natural = (x, label) => {
  if (!Number.isSafeInteger(x) || x < 0) throw new TypeError(`${label} must be a nonnegative safe integer`);
  return x;
};
const refs = (x, label) => {
  if (!Array.isArray(x) || x.length === 0) throw new TypeError(`${label} must have at least one source`);
  const result = x.map((item, index) => text(item, `${label}[${index}]`));
  if (new Set(result).size !== result.length) throw new TypeError(`${label} must not duplicate sources`);
  return Object.freeze(result);
};
const profiles = new Set(Object.keys(researchPaperProfiles));
const noEffect = "Read-only authoring evidence, not scientific validation, independent review, copyright clearance, publication authority, permitted platform submission, released paper or audience acceptance.";
const grade = sections => {
  const written = sections.filter(s => s.body.trim()).length;
  return Object.freeze({
    stage: written === 0 ? "outline-only" : written === sections.length ? "full-text-unreviewed" : "partial-draft",
    writtenSections: written,
    requiredSections: sections.length,
    unwritten: Object.freeze(sections.filter(s => !s.body.trim()).map(s => s.id)),
  });
};

/**
 * Plan multiple DIFFERENT source-supported papers and inspect each external
 * outlet's independently supplied CURRENT submission capacity. Manuscripts
 * are not throttled by venues; no individual draft is assigned for submission.
 *
 * papers[] = { draft: planResearchPaperDraft input (including profile, sectionBodies),
 *   research: {sourceLocator, sourceRevision, primaryClaimId,
 *              claimStatus, evidenceRefs, comparisonRefs},
 *   intendedOutlets?: string[] }
 *
 * windows[] = {id, policySource, policyObservedOn, period,
 *   newSubmissionLimit, submissionsUsed, activeLimit?, activeUsed?,
 *   profiles?: string[]}.
 */
export function planResearchManuscriptSupply({ papers = [], windows = [] } = {}) {
  if (!Array.isArray(papers) || !Array.isArray(windows))
    throw new TypeError("papers and publication windows must be arrays");
  const seenIds = new Set(), seenContributions = new Set();
  const manuscripts = papers.map((item, index) => {
    if (!isRecord(item) || !isRecord(item.draft) || !isRecord(item.research))
      throw new TypeError(`paper ${index} needs a draft and source-qualified research`);
    const { draft, research } = item;
    const sourceLocator = text(research.sourceLocator, "source locator");
    const sourceRevision = text(research.sourceRevision, "source revision");
    const primaryClaimId = text(research.primaryClaimId, "primary claim id");
    const claimStatus = text(research.claimStatus, "declared research claim status");
    const evidenceRefs = refs(research.evidenceRefs, "evidence references");
    const comparisonRefs = refs(research.comparisonRefs, "prior/comparator references");
    if (comparisonRefs.every(ref => evidenceRefs.includes(ref)))
      throw new TypeError("a paper must distinguish its research evidence from comparison or prior work");
    const plan = planResearchPaperDraft(draft);
    const id = plan.frontmatter.id;
    if (seenIds.has(id)) throw new TypeError(`duplicate manuscript identity: ${id}`);
    seenIds.add(id);
    const contributionKey = JSON.stringify([sourceLocator, primaryClaimId]);
    if (seenContributions.has(contributionKey))
      throw new TypeError(`duplicate primary research contribution ${primaryClaimId}; do not inflate manuscript supply with the same result`);
    seenContributions.add(contributionKey);
    const intendedOutlets = item.intendedOutlets === undefined
      ? Object.freeze([]) : refs(item.intendedOutlets, "intended outlets");
    const completeness = grade(plan.sections);
    return Object.freeze({
      id, plan, profile: plan.profile ?? "formal",
      source: Object.freeze({ locator: sourceLocator, revision: sourceRevision }),
      primaryContribution: Object.freeze({ id: primaryClaimId, declaredStatus: claimStatus }),
      evidenceRefs, comparisonRefs, intendedOutlets,
      ...completeness,
    });
  });
  const outlets = new Set();
  const publicationWindows = windows.map(window => {
    if (!isRecord(window)) throw new TypeError("publication window must be a record");
    const id = text(window.id, "publication outlet id");
    if (outlets.has(id)) throw new TypeError(`duplicate publication outlet ${id}`);
    outlets.add(id);
    // A venue policy is external evidence; old or guessed quotas do not
    // silently become permanent universal publication rules.
    const policySource = text(window.policySource, "outlet policy source");
    const policyObservedOn = text(window.policyObservedOn, "outlet policy observation date");
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(policyObservedOn))
      throw new TypeError("outlet policy observation date must use YYYY-MM-DD");
    const period = text(window.period, "outlet window");
    const newSubmissionLimit = natural(window.newSubmissionLimit, "new submissions permitted");
    const submissionsUsed = natural(window.submissionsUsed, "new submissions already used");
    if (submissionsUsed > newSubmissionLimit) throw new TypeError("outlet submission usage exceeds declared limit");
    const activeLimit = window.activeLimit === undefined ? null : natural(window.activeLimit, "active submissions limit");
    const activeUsed = window.activeUsed === undefined ? 0 : natural(window.activeUsed, "active submissions used");
    if (activeLimit === null && window.activeUsed !== undefined || activeLimit !== null && activeUsed > activeLimit)
      throw new TypeError("active submissions must have a valid declared limit");
    const validProfiles = window.profiles === undefined ? Object.freeze([...profiles]) : refs(window.profiles, "outlet profiles");
    if (validProfiles.some(p => !profiles.has(p))) throw new TypeError("outlet requires unknown scientific profile");
    const remainingNew = newSubmissionLimit - submissionsUsed;
    const remainingActive = activeLimit === null ? remainingNew : activeLimit - activeUsed;
    const availableSlots = Math.min(remainingNew, remainingActive);
    const matchingManuscriptIds = manuscripts
      .filter(m => m.stage === "full-text-unreviewed" && validProfiles.includes(m.profile) && m.intendedOutlets.includes(id))
      .map(m => m.id);
    return Object.freeze({
      id, period, policySource, policyObservedOn, newSubmissionLimit,
      submissionsUsed, activeLimit, activeUsed,
      profiles: Object.freeze([...validProfiles]),
      availableSlots, matchingManuscriptIds: Object.freeze(matchingManuscriptIds),
      apparentSurplus: Math.max(0, matchingManuscriptIds.length - availableSlots),
      // Publication eligibility, submitter approval, editorial assessment
      // and external receipts are NOT derived from a venue slot.
      interpretation: "Illustrative capacity against full-text drafts, not review eligibility or a submission recommendation.",
    });
  });
  for (const m of manuscripts) for (const id of m.intendedOutlets)
    if (!outlets.has(id)) throw new TypeError(`undeclared intended publication outlet: ${id}`);
  const count = stage => manuscripts.filter(m => m.stage === stage).length;
  return Object.freeze({
    kind: "research-manuscript-supply/v1",
    manuscripts: Object.freeze(manuscripts),
    publicationWindows: Object.freeze(publicationWindows),
    counts: Object.freeze({
      distinctPrimaryContributions: seenContributions.size,
      totalPlans: manuscripts.length,
      outlineOnly: count("outline-only"),
      partialDrafts: count("partial-draft"),
      fullTextUnreviewed: count("full-text-unreviewed"),
    }),
    limit: noEffect,
  });
}
