# Research paper authoring service

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

This service holds research-paper meaning: draft metadata, the thesis-centered
section plan, note provenance, and advisory structural assessment. It does not
parse or render Markdown, write files, invoke Pandoc, or publish a document.
Pass its plan to the canonical Markdown section renderer, and pass Markdown
observations back to `assessResearchPaperStructure` when assessing a draft.

## Versioned, independently received preprints

`./publication-readiness` exports `assessResearchPublicationReadiness`. It admits a paper version, explicit human responsibility and AI disclosures, scientific-status qualifications, declared source locators, and byte checksums. Its separately supplied byte-verification, public release and DOI receipts deliberately produce **different states**: a prepared candidate is not a published citable release, and a public release is not automatically DOI-registered. This is a pure meaning-side evaluation, not a second Pandoc builder, GitHub release effecter, archive depositor, referee or news distributor. The caller must independently authenticate receipts and ensure publication rights.

Use the Coesite Research Operations receiving procedure and the canonical Pandoc document-projection service for actual build and release. Running the Node test file gives deterministic admission/refusal fixtures; it does not attest to production deployment.


## Prospective simulation study evidence before empirical publication

The existing \`./publication-readiness\` import now also exports **\`assessProspectiveSimulationEvidence({plan,freezeReceipts,run,independentReceipt,registrationReceipt})\`**. It is a **pure meaning-side evidence assessor**, not a second experiment runner, preregistration website, journal/publisher, source parser, dataset vault, funding authorizer or scientific certifier. It is deliberately specialized for **confirmatory synthetic-colony simulations** rather than imposing randomized-arm requirements on interpretive, historical, formal, or exploratory research.

Its study plan identifies original Science Work and owning section; protocol and analysis-plan *source URLs and digests*; whole-colony assignment unit, distinct treatment arms, estimand, primary outcome, rival explanation, allocation/stop/missingness rules, negative controls and rights/access rationale. Source qualification is separate from **two independent plan-freeze receipts**. The freeze must precede the qualifying Run start to support a *prospective* claim. A Git commit or frozen internal plan is **not an OSF Registry registration**; the optional external-registration flag requires a separate claimed provider receipt and exact matching digests. The caller must authenticate receipts externally; this evaluator cannot.

For an executed Run the assessor requires a real \`runId\`, source software revision, producer identity, exact protocol/analysis digests, input/result/code/trace digests, start/end timestamps, complete whole-colony assigned/completed/failed/aborted denominator, and counts for every original treatment arm. Every preregistered negative control needs its own source-addressed disposition; **a failed control preserves the run as evidence but refuses a confirmatory result**. A claimed independent replay needs a *different receiver identity*, matching plan/trace/result IDs, an observed later time, reviewed controls and a positive bounded replay count. Matching supplied receipt fields is **not independently verified scientific causality, provider identity, empirical social validity or legal publication clearance**.

This is a deliberately narrow concrete consumer of [Coesite Research Operations' open-science commission](https://github.com/coesite-operations/operations-services-section/blob/main/services/research-operations-services-section/README.md) and the already source-owned [Lenticule agent-governance study](https://github.com/lenticule-science/governance-services-section/issues/13), **not proof that Holofoam and AOE have a qualified coupled adapter or that the study was run**. The method aligns evidence stages with [TOP 2025](https://www.cos.io/initiatives/top-guidelines); trace packaging and research distribution still belong to the existing [RO-Crate 1.3](https://www.researchobject.org/ro-crate/specification/1.3/) metadata, Pandoc and publishing owners. Research protocols, source summaries and negative cases should still be written in the true Science owner. No data need be made publicly downloadable when valid CARE, privacy or contractual restrictions prohibit it; the rights/access rationale survives separately from release status.

The 15 regression cases exercise honest source-only plans, valid independent-replay receipts, prospective chronology, missing whole-colony denominators, duplicate arms, failed and absent controls, self-reviews, mismatched replay evidence and external-registration claims. **Passing tests qualifies only this pure receipt-consistency function.** The actual installed artifact, independently authenticated host records, scientific result and publicly received paper require separate receiving.

## Manuscript supply can exceed publication throughput

Lenticule Science needs **more source-substantive papers in development than it can responsibly submit to any particular venue during a publication window**. An original, independently discriminating contribution may warrant a dedicated paper even before someone asks for a PDF. Neither outside moderation nor a platform's submission allowance is a ceiling on scientific authoring. A completed manuscript may remain internal, seek substantive review, combine with related results, or wait for a suitable venue. **Multiple papers about one topic are fine; multiple paper identities claiming the same primary finding as novel are not.**

The original `./src/research-paper-authoring.mjs` now supports `profile: "formal" | "empirical" | "interpretive" | "methods"` and accepts genuine **source-authored** `sectionBodies` keyed by the chosen field's sections. The original formal structure and blank-plan call remain compatible. The maker transports supplied research content; it does **not** invent observations, proofs, bibliography or author approval. Its `assessResearchPaperStructure` follows the matching research discipline rather than requiring every social-science, interpretive or methods paper to have a formal mathematical lemma.

The `./manuscript-supply` export `planResearchManuscriptSupply` operates *over* those original plans. Each paper must name its original source and revision, **one distinct primary contribution**, its declared scientific claim status, source evidence and comparison/prior-work references. Different claims in the **same** original study may become different manuscripts; duplicate primary claims are rejected so a manuscript factory cannot appear productive by salami-slicing one result repeatedly. Plans are classified as `outline-only`, `partial-draft`, or `full-text-unreviewed` purely by actual filled section bodies. Even a full-text candidate is **not** thereby scientifically sound, peer reviewed, cleared for release, or published.

Publication windows are **independent caller-supplied observations**, with policy source/date/period and optional separate new-submission and active-submission ceilings. Each channel reports its remaining slots, matching full-text *potential* candidates and the number of manuscripts in **apparent surplus** for that window, without committing a submission, inventing eligibility or globally throttling writing. This is a meaning-side comparison, **not** a publication queue, scheduler, rights grant or data store.

```js
import { planResearchManuscriptSupply } from "@red-cup-engineering/research-paper-authoring-service/manuscript-supply";

const result = planResearchManuscriptSupply({
  papers: [{
    draft: {
      id: "worked-conditional-example", title: "An example of an authored conditional result",
      createdOn: "2026-10-23", authors: ["Example researcher"],
      profile: "formal",
      sectionBodies: {
        abstract: "...authored actual summary...",
        thesis: "...authored claim, mechanism and consequences...",
        foundations: "...sourced assumptions and prior work...",
        synthesis: "...authored derivation...",
        lemma: "...actual proof or explicitly conditional argument...",
        measurement: "...replayable finite test and its contrary case...",
      },
    },
    research: {
      sourceLocator: "https://example.org/original-study",
      sourceRevision: "example:revision",
      primaryClaimId: "one-distinct-main-claim",
      claimStatus: "conditional-unreviewed",
      evidenceRefs: ["https://example.org/evidence"],
      comparisonRefs: ["https://example.org/comparator"],
    },
    intendedOutlets: ["field-archive"],
  }],
  windows: [{
    id: "field-archive", policySource: "https://example.org/current-venue-policy",
    policyObservedOn: "2026-10-23", period: "example calendar month",
    newSubmissionLimit: 2, submissionsUsed: 1,
  }],
});
// source-authored plan and per-venue apparentSurplus; NO paper or POST is emitted
```

**Current platform policies are not embedded in these rules.** In October 2026, [arXiv's moderation guide](https://github.com/arXiv/arxiv-docs/blob/develop/source/help/moderation/index.md) describes a limit of two new submissions per author per calendar month and at most three active submissions, with category endorsement rules and moderation; [OSF Preprints' current policy](https://help.osf.io/article/691-preprint-moderation-policies) restricts predominantly AI-generated content and uses community moderation; [Zenodo's fair-use guidance](https://support.zenodo.org/help/en-gb/1-upload-deposit/80-what-are-the-size-limitations-of-zenodo) distinguishes artifact preservation from extremely high-volume promotional depositing. All venue policies must be checked again, per author/category/content and at the actual submission time. A Group-controlled scholarly site, technical repository, moderated preprint platform and peer-reviewed journal are different publication receivers, not interchangeable substitutes.

The original `./publication-readiness` still distinguishes versioned byte-verification, actual publicly received release and DOI receipt. It is the **only existing meaning-side release-readiness assessor here**; the new manuscript supply library makes no duplicate public-release checker. The actual proof or experiment, editorial review, licensed source bundle, Open Research/RO-Crate metadata, Pandoc fabrication, Science Web release, and independently tested public receiver remain with their original Lenticule/Red Cup/Coesite/Causeway owners.

Native tests cover several distinct fully authored candidate shapes against one publication slot, a different-valid source profile, an unfinished source, zero outlet capacity, duplicate-source refusal and absence of a release/DOI. Fixture text is deliberately labeled **not an original research result or a completed paper**. Use `npm test`; a passing suite proves only this pure authoring projection.
