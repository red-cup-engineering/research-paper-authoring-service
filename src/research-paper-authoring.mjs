const IDENTIFIER = /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/u;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;

const freeze = (value) => Object.freeze(value);
const strings = (value, name) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) throw new TypeError(`${name} must be an array of non-empty strings`);
  return freeze([...value]);
};

export const researchPaperStructure = freeze([
  freeze({ id: "abstract", heading: "Abstract", markerVariants: freeze(["abstract"]) }),
  freeze({ id: "thesis", heading: "0. Thesis (Claim → Mechanism → Consequence → Contributions)", markerVariants: freeze(["0. thesis", "thesis (centered)"]) }),
  freeze({ id: "foundations", heading: "Foundations", markerVariants: freeze(["foundations", "critical foundations", "domain foundations"]) }),
  freeze({ id: "synthesis", heading: "Theory→Model Synthesis", markerVariants: freeze(["synthesis", "theory→model", "theory->model"]) }),
  freeze({ id: "lemma", heading: "Lemmas and Regimes", markerVariants: freeze(["lemma", "lemmas", "proof"]) }),
  freeze({ id: "measurement", heading: "Measurement", markerVariants: freeze(["measurement", "appendix: measurement"]) }),
]);

/** Different fields demand different paper forms. The formal profile is the original default. */
const paperProfiles = freeze({
  formal: researchPaperStructure,
  empirical: freeze([
    freeze({ id: "abstract", heading: "Abstract", markerVariants: freeze(["abstract"]) }),
    freeze({ id: "question", heading: "Research Question and Prior Work", markerVariants: freeze(["research question", "prior work"]) }),
    freeze({ id: "methods", heading: "Methods and Controls", markerVariants: freeze(["methods", "study design"]) }),
    freeze({ id: "results", heading: "Results and Uncertainty", markerVariants: freeze(["results", "observations"]) }),
    freeze({ id: "counterevidence", heading: "Alternative Explanations and Negative Cases", markerVariants: freeze(["alternative explanations", "negative cases", "counterevidence"]) }),
    freeze({ id: "limitations", heading: "Limitations and Reproducibility", markerVariants: freeze(["limitations", "reproducibility"]) }),
  ]),
  interpretive: freeze([
    freeze({ id: "abstract", heading: "Abstract", markerVariants: freeze(["abstract"]) }),
    freeze({ id: "question", heading: "Question and Intervention", markerVariants: freeze(["question", "intervention"]) }),
    freeze({ id: "sources", heading: "Sources, Context and Genealogy", markerVariants: freeze(["sources", "context", "genealogy"]) }),
    freeze({ id: "argument", heading: "Interpretation and Argument", markerVariants: freeze(["interpretation", "argument"]) }),
    freeze({ id: "counterreadings", heading: "Rival Readings and Negative Cases", markerVariants: freeze(["rival readings", "counterreadings", "negative cases"]) }),
    freeze({ id: "limitations", heading: "Scope, Limitations and Consequences", markerVariants: freeze(["limitations", "scope"]) }),
  ]),
  methods: freeze([
    freeze({ id: "abstract", heading: "Abstract", markerVariants: freeze(["abstract"]) }),
    freeze({ id: "problem", heading: "Research Instrument Problem", markerVariants: freeze(["problem", "research instrument"]) }),
    freeze({ id: "design", heading: "Method and Instrument Design", markerVariants: freeze(["method", "instrument design"]) }),
    freeze({ id: "evaluation", heading: "Independent Comparison and Evaluation", markerVariants: freeze(["evaluation", "comparison"]) }),
    freeze({ id: "refusals", heading: "Failure, Refusal and Alternative Cases", markerVariants: freeze(["failure", "refusal", "alternative"]) }),
    freeze({ id: "reuse", heading: "Reproduction, Limits and Reuse", markerVariants: freeze(["reproduction", "limits", "reuse"]) }),
  ]),
});
export const researchPaperProfiles = paperProfiles;
function paperStructure(profile) {
  if (typeof profile !== "string" || !Object.hasOwn(paperProfiles, profile))
    throw new TypeError("profile must name a supported scientific paper structure");
  return paperProfiles[profile];
}
function sectionText(provided, structure) {
  if (provided === null || typeof provided !== "object" || Array.isArray(provided))
    throw new TypeError("sectionBodies must be a record of authored text by section id");
  const allowed = new Set(structure.map(({ id }) => id));
  for (const [id, text] of Object.entries(provided)) {
    if (!allowed.has(id)) throw new TypeError(`unsupported authored section ${id}`);
    if (typeof text !== "string") throw new TypeError(`authored section ${id} must be text`);
  }
  return provided;
}

function date(value, name) {
  if (typeof value !== "string" || !ISO_DATE.test(value)) throw new TypeError(`${name} must be an ISO calendar date`);
  return value;
}

function metadata({ id, title, status = "draft", documentType = "paper", authors = [], topics = [], disciplines = [], keywords = [], createdOn, modifiedOn = createdOn }) {
  if (typeof id !== "string" || !IDENTIFIER.test(id)) throw new TypeError("id must be a lowercase hyphenated identifier");
  if (typeof title !== "string" || title.trim() === "") throw new TypeError("title must be a non-empty string");
  if (typeof status !== "string" || status.trim() === "") throw new TypeError("status must be a non-empty string");
  if (typeof documentType !== "string" || documentType.trim() === "") throw new TypeError("documentType must be a non-empty string");
  return freeze({
    id, title, status, document_type: documentType,
    date_created: date(createdOn, "createdOn"), date_modified: date(modifiedOn, "modifiedOn"),
    authors: strings(authors, "authors"), topics: strings(topics, "topics"), disciplines: strings(disciplines, "disciplines"), keywords: strings(keywords, "keywords"),
  });
}

/** Plan one thesis-centered research paper without deciding its Markdown encoding or write location. */
export function planResearchPaperDraft(options) {
  const { profile = "formal", sectionBodies = {} } = options ?? {};
  const structure = paperStructure(profile);
  const authored = sectionText(sectionBodies, structure);
  const frontmatter = metadata(options ?? {});
  // A paper can be created from existing, source-qualified scientific writing.
  // We never generate a result, cite an unread source or call a blank outline a paper.
  const sections = structure.map(({ id, heading }) => freeze({
    id, level: 2, title: heading, body: authored[id] ?? "",
  }));
  return freeze({
    kind: "research-paper-draft-plan/v1", frontmatter,
    ...(profile === "formal" ? {} : { profile }),
    sections: freeze(sections),
  });
}

/** Attach a research-note provenance witness to a new draft plan without copying it into a second file format. */
export function planResearchPaperFromNote({ note, ...options } = {}) {
  if (!note || typeof note.locator !== "string" || note.locator.trim() === "") throw new TypeError("note.locator must be a non-empty string");
  if (note.text !== undefined && typeof note.text !== "string") throw new TypeError("note.text must be a string when provided");
  const plan = planResearchPaperDraft({ ...options, title: options.title ?? note.locator.split("/").at(-1).replace(/[-_]/gu, " ").replace(/\.[^.]+$/u, "") });
  return freeze({ ...plan, provenance: freeze({ sourceNote: freeze({ locator: note.locator, ...(note.text === undefined ? {} : { text: note.text }) }) }) });
}

/** Assess a paper from canonical Markdown observations; this service never parses Markdown or performs file I/O. */
export function assessResearchPaperStructure({ frontmatter, headings, hasTable = false, profile = "formal" } = {}) {
  const errors = [];
  const warnings = [];
  if (frontmatter === null || frontmatter === undefined) errors.push("Missing document frontmatter");
  else if (typeof frontmatter !== "object" || Array.isArray(frontmatter)) errors.push("Document frontmatter must be an object");
  if (!Array.isArray(headings) || headings.some((heading) => typeof heading?.title !== "string")) throw new TypeError("headings must be parsed heading records with titles");
  if (typeof hasTable !== "boolean") throw new TypeError("hasTable must be boolean");
  const headingText = headings.map(({ title }) => title.toLowerCase()).join("\n");
  for (const requirement of paperStructure(profile).slice(1)) {
    if (!requirement.markerVariants.some((marker) => headingText.includes(marker))) warnings.push(`Section likely missing or unmarked: ${requirement.id}`);
  }
  if (!hasTable && (profile === "formal" || profile === "empirical")) warnings.push("No demonstration table was identified");
  return freeze({ ok: errors.length === 0, errors: freeze(errors), warnings: freeze(warnings) });
}
