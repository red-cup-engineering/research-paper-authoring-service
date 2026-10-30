import test from "node:test";
import assert from "node:assert/strict";
import {
  planResearchPaperDraft, assessResearchPaperStructure, researchPaperProfiles,
} from "../src/research-paper-authoring.mjs";
import { planResearchManuscriptSupply } from "../src/manuscript-supply.mjs";
import { assessResearchPublicationReadiness } from "../src/publication-readiness.mjs";

// Source-located research examples, NOT new manuscripts or independently verified findings.
// The assay tests the maker against original Lenticule Science document identities.
const source = {
  fibers: "https://github.com/lenticule-science/obsmetrologia/blob/main/docs/preprints/02-feathers-fleets-and-farms-finite-fibers.md",
  adapt: "https://github.com/lenticule-science/obsmetrologia/blob/main/docs/preprints/01-obstruction-preserving-adaptive-software.md",
  foundation: "https://github.com/lenticule-science/obsmetrologia/blob/main/docs/preprints/00-generated-relational-foundation.md",
};
const bodies = profile => Object.fromEntries(researchPaperProfiles[profile].map(x => [
  x.id, `Source-authored scientific ${x.id} text examining the scoped conditional result and the exact contrary model, not a claimed externally observed finding.`,
]));
const paper = (id, contribution, {
  locator = source.fibers, profile = "formal", outlets = ["science-site", "restricted-archive"],
  complete = true,
} = {}) => ({
  draft: {
    id, title: `Source-qualified candidate ${id}`,
    createdOn: "2026-10-23", authors: ["Lenticule Science"],
    profile,
    sectionBodies: complete ? bodies(profile) : { abstract: "Scoped working abstract, not yet a manuscript." },
  },
  research: {
    sourceLocator: locator, sourceRevision: "git-blob:known-source-witness",
    primaryClaimId: contribution,
    claimStatus: "conditional downstream argument, independently unreviewed",
    evidenceRefs: [`${locator}#source-derivation`],
    comparisonRefs: [`${source.adapt}#explicit-novelty-limits`],
  },
  intendedOutlets: outlets,
});
const windows = () => [
  {
    id: "science-site", policySource: "https://science.561.group/",
    policyObservedOn: "2026-10-23", period: "fixture 2026-10-23",
    newSubmissionLimit: 1, submissionsUsed: 0,
    profiles: ["formal", "empirical", "interpretive", "methods"],
  },
  {
    id: "restricted-archive", policySource: "https://example.org/current-policy",
    policyObservedOn: "2026-10-23", period: "fixture calendar month",
    newSubmissionLimit: 2, submissionsUsed: 1, activeLimit: 3, activeUsed: 3,
    profiles: ["formal"],
  },
];

test("original formal draft shape is unchanged, and author supplied evidence is copied, not synthesized", () => {
  const base = planResearchPaperDraft({
    id: "source-original", title: "Original", createdOn: "2026-10-23",
  });
  assert.equal(base.kind, "research-paper-draft-plan/v1");
  assert.equal(base.sections.length, 6);
  assert.equal(base.sections.find(x => x.id === "lemma").body, "");
  assert.equal(Object.hasOwn(base, "profile"), false);
  const authored = planResearchPaperDraft({
    id: "source-authored", title: "Authored", createdOn: "2026-10-23",
    sectionBodies: { abstract: "A supplied, attributable abstract.", lemma: "A supplied conditional lemma." },
  });
  assert.equal(authored.sections.find(x => x.id === "abstract").body, "A supplied, attributable abstract.");
  assert.equal(authored.sections.find(x => x.id === "measurement").body, "");
  assert.throws(() => planResearchPaperDraft({
    id: "bad", title: "Bad", createdOn: "2026-10-23", sectionBodies: { fakeResults: "invented" },
  }), /unsupported authored section/u);
});

test("manuscript counts admit only owned, snapshotted source-authored section bodies", () => {
  const inherited = Object.fromEntries(researchPaperProfiles.formal.map(({ id }) => [
    id, "This text exists only on an input prototype, not in the authored section carrier.",
  ]));
  const supplied = Object.create(inherited);
  supplied.abstract = "The original source owns exactly this section.";
  const candidate = paper("owned-section", "claim-with-one-authored-section");
  candidate.draft.sectionBodies = supplied;
  const planned = planResearchPaperDraft(candidate.draft);
  assert.equal(planned.sections.find(s => s.id === "abstract").body, supplied.abstract);
  assert.equal(planned.sections.find(s => s.id === "lemma").body, "");
  const inventory = planResearchManuscriptSupply({ papers: [candidate], windows: windows() });
  assert.equal(inventory.counts.partialDrafts, 1);
  assert.equal(inventory.counts.fullTextUnreviewed, 0,
    "inherited text must never turn a partial draft into a full-text manuscript");

  let reads = 0;
  const accessorInput = {};
  Object.defineProperty(accessorInput, "abstract", {
    enumerable: true,
    get() { return ++reads === 1 ? "Originally submitted section" : "Changed after validation"; },
  });
  const captured = planResearchPaperDraft({
    id: "accessor-once", title: "Source snapshot", createdOn: "2026-10-23",
    sectionBodies: accessorInput,
  });
  assert.equal(reads, 1, "source body is read once during admission");
  assert.equal(captured.sections.find(s => s.id === "abstract").body, "Originally submitted section");
  assert.equal(captured.sections.find(s => s.id === "lemma").body, "");
});

test("manuscript profile and outlet eligibility come from one admitted authored plan", () => {
  const candidate = paper("profile-source", "profile-type-consistency", { outlets: ["science-site"] });
  let reads = 0;
  Object.defineProperty(candidate.draft, "profile", {
    enumerable: true,
    get() { return ++reads === 1 ? "formal" : "interpretive"; },
  });
  const onlyInterpretive = windows().map(w =>
    w.id === "science-site" ? { ...w, profiles: ["interpretive"] } : w);
  const supplied = planResearchManuscriptSupply({ papers: [candidate], windows: onlyInterpretive });
  const manuscript = supplied.manuscripts[0];
  assert.equal(reads, 1, "admit a paper profile only once, not again after constructing its sections");
  assert.equal(manuscript.profile, "formal", "reported profile must equal the source plan's chosen form");
  assert.equal(manuscript.plan.sections.some(section => section.id === "lemma"), true);
  assert.deepEqual(supplied.publicationWindows.find(w => w.id === "science-site").matchingManuscriptIds, [],
    "a formal plan is not an interpretive manuscript merely because its input getter changes");
});

test("empirical, interpretive and methods work is not rejected for missing a formal lemma", () => {
  for (const profile of ["empirical", "interpretive", "methods"]) {
    const authored = planResearchPaperDraft({
      id: `profile-${profile}`, title: "Different legitimate research form",
      createdOn: "2026-10-23", profile, sectionBodies: bodies(profile),
    });
    assert.equal(authored.profile, profile);
    assert.equal(authored.sections.length, 6);
    assert.equal(authored.sections.some(x => x.id === "lemma"), false);
    const result = assessResearchPaperStructure({
      frontmatter: authored.frontmatter,
      headings: authored.sections.map(x => ({ title: x.title })),
      hasTable: false, profile,
    });
    assert.equal(result.ok, true);
    assert.equal(result.warnings.some(w => /lemma/u.test(w)), false);
    if (profile === "interpretive") assert.equal(result.warnings.includes("No demonstration table was identified"), false);
  }
  assert.throws(() => planResearchPaperDraft({
    id: "invalid", title: "Bad", createdOn: "2026-10-23", profile: "all-purpose AI",
  }), /scientific paper structure/u);
});

test("multiple actual-distinct source claims become structurally full manuscript plans even when publication has only one slot", () => {
  const candidates = [
    paper("finite-fiber-sections", "finite-fiber-incidence-descent"),
    paper("finite-fleet-capacity", "agent-fleet-hall-capacity"),
    paper("projection-obstruction", "record-shadow-does-not-reflect", { locator: source.adapt }),
    paper("unfinished-inquiry", "generated-first-mark", { locator: source.foundation, complete: false }),
  ];
  const result = planResearchManuscriptSupply({ papers: candidates, windows: windows() });
  assert.equal(result.counts.totalPlans, 4);
  assert.equal(result.counts.distinctPrimaryContributions, 4);
  assert.equal(result.counts.fullTextUnreviewed, 3);
  assert.equal(result.counts.partialDrafts, 1);
  assert.equal(result.counts.outlineOnly, 0);
  assert.equal(result.manuscripts[0].plan.sections.find(x => x.id === "abstract").body, bodies("formal").abstract);
  assert.equal(result.manuscripts[3].unwritten.length, 5);
  const site = result.publicationWindows.find(x => x.id === "science-site");
  assert.equal(site.availableSlots, 1);
  assert.equal(site.apparentSurplus, 2, "surplus is not an error or permission to split papers");
  const archive = result.publicationWindows.find(x => x.id === "restricted-archive");
  assert.equal(archive.availableSlots, 0, "concurrent-active cap also binds a venue");
  assert.equal(archive.apparentSurplus, 3);
  assert.match(result.limit, /not scientific validation/u);
});

test("distinct research results in ONE original study can support distinct manuscripts; duplicated primary result cannot inflate counts", () => {
  const first = paper("first", "theorem-descent");
  const second = paper("second", "algorithm-capacity");
  assert.equal(planResearchManuscriptSupply({ papers: [first, second], windows: windows() }).counts.fullTextUnreviewed, 2);
  assert.throws(
    () => planResearchManuscriptSupply({ papers: [first, { ...second, research: { ...second.research, primaryClaimId: "theorem-descent" } }], windows: windows() }),
    /duplicate primary research contribution/u,
  );
});

test("outlet limits are input-specific, never globally throttling the manuscript producer", () => {
  const ownPaper = paper("textual", "rival-reading-interpretation", {
    locator: source.foundation, profile: "interpretive", outlets: ["science-site"],
  });
  const first = planResearchManuscriptSupply({ papers: [ownPaper], windows: windows() });
  assert.equal(first.counts.fullTextUnreviewed, 1);
  assert.deepEqual(first.publicationWindows.find(x => x.id === "restricted-archive").matchingManuscriptIds, []);
  const exhausted = windows().map(w => ({ ...w, submissionsUsed: w.newSubmissionLimit }));
  const second = planResearchManuscriptSupply({ papers: [ownPaper], windows: exhausted });
  assert.equal(second.counts.fullTextUnreviewed, 1, "a platform with zero release slots cannot ban source authoring");
  assert.equal(second.publicationWindows.find(x => x.id === "science-site").apparentSurplus, 1);
  assert.throws(() => planResearchManuscriptSupply({
    papers: [paper("unknown-venue", "different", { outlets: ["not-listed"] })],
    windows: windows(),
  }), /undeclared intended publication outlet/u);
});

test("manuscript production never authorizes a public article, human authorship claim or issued DOI", () => {
  const r = planResearchManuscriptSupply({ papers: [paper("unreviewed", "held-proof")], windows: windows() });
  assert.equal(r.manuscripts[0].stage, "full-text-unreviewed");
  assert.equal(Object.hasOwn(r.manuscripts[0], "published"), false);
  assert.equal(assessResearchPublicationReadiness({}).status, "invalid-candidate");
  assert.equal(Object.hasOwn(r, "publicUrl"), false);
  assert.throws(() => planResearchManuscriptSupply({ papers: [{
    ...paper("bad", "unknown", { outlets: [] }),
    research: { sourceLocator: "", primaryClaimId: "unknown", evidenceRefs: [], comparisonRefs: [] },
  }] }), /source locator/u);
});

test("source revisions, venue policies, and real third-party claims remain separate explicit inputs", () => {
  const w = windows(); w[0].submissionsUsed = 2;
  assert.throws(() => planResearchManuscriptSupply({ papers: [], windows: w }), /usage exceeds declared limit/u);
  const v = windows(); v[0].policyObservedOn = "unknown";
  assert.throws(() => planResearchManuscriptSupply({ papers: [], windows: v }), /observation date/u);
  const noActive = windows(); delete noActive[1].activeLimit;
  assert.throws(() => planResearchManuscriptSupply({ papers: [], windows: noActive }), /valid declared limit/u);
});
