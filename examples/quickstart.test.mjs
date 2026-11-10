import test from "node:test";
import assert from "node:assert/strict";
import { planResearchPaperDraft } from "@red-cup-engineering/research-paper-authoring-service";

test("RESEARCH-PAPER-AUTHORING-SERVICE-QUICKSTART", () => {
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
