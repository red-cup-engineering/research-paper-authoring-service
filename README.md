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
