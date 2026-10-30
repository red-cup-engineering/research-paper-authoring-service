import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {assessResearchPublicationReadiness as check} from "../src/publication-readiness.mjs";
const H="a".repeat(64),U="https://example.org/archive/v0.1.0";
const candidate=()=>({kind:"lenticule.research-publication.v1",title:"Paper",version:"0.1.0",status:"release-candidate",discipline:"historical sociology",publishing_organization:"Lenticule Science",authors:[{name:"Morgan Sennhauser",role:"accountable-human-author"},{name:"Codex 6.1",role:"AI collaborator"}],ai_disclosure:"AI assistant Codex disclosed",evidence:{claim:"conjecture not demonstrated"},files:{"paper.pdf":{sha256:H,bytes:10}},source_manuscripts:["https://example.org/source.md"],doi:null});
const receipt=[{path:"paper.pdf",sha256:H,bytes:10,verified:true}];
const published=()=>({...candidate(),status:"published",canonical_public_url:U,released_at:"2026-10-18T00:00:00Z"});
const publicReceipt={verified:true,publicUrl:U,version:"0.1.0",observedAt:"2026-10-18T01:00:00Z",manifestSha256:"b".repeat(64)};
const sourceEvidence=m=>{
 const manifestBytes=Buffer.from(JSON.stringify(m),"utf8");
 return {manifestBytes,manifestSha256:createHash("sha256").update(manifestBytes).digest("hex")};
};
// Existing positive test cases describe a source-bound fixture. Individual
// adversarial tests below invoke the original function directly so a hostile
// receipt can never inherit a fabricated source digest from this helper.
const checkPublished=input=>{
 if(!input?.publicReceipt||!input.manifest)return check(input);
 const {manifestBytes,manifestSha256}=sourceEvidence(input.manifest);
 return check({...input,manifestBytes,publicReceipt:{...input.publicReceipt,manifestSha256}});
};
const doiEvidence=m=>({verified:true,doi:m.doi,version:m.version,publicUrl:U,
 observedAt:"2026-10-18T02:00:00Z",manifestSha256:sourceEvidence(m).manifestSha256});

test("candidate metadata cannot constitute a public release",()=>assert.equal(checkPublished({manifest:candidate()}).status,"metadata-ready-artifacts-unverified"));
test("byte receipts without release remain unpublished",()=>assert.equal(checkPublished({manifest:candidate(),artifactReceipts:receipt}).status,"reproducible-candidate-not-public"));
test("the word published cannot fabricate public receiving",()=>assert.equal(checkPublished({manifest:published(),artifactReceipts:receipt}).flags.publiclyCitable,false));
test("an independently observed versioned release can be cited without a DOI",()=>{const r=checkPublished({manifest:published(),artifactReceipts:receipt,publicReceipt});assert.equal(r.status,"public-release-received");assert.equal(r.doi,null)});
test("DOI requires matching independent registration evidence",()=>{const m=published();m.doi="10.5281/zenodo.123456";const a=checkPublished({manifest:m,artifactReceipts:receipt,publicReceipt});assert.equal(a.flags.doiReceived,false);const b=checkPublished({manifest:m,artifactReceipts:receipt,publicReceipt,doiReceipt:doiEvidence(m)});assert.equal(b.status,"doi-received")});
test("AI disclosure and accountable human are mandatory",()=>{const m=candidate();delete m.ai_disclosure;assert.ok(checkPublished({manifest:m}).failures.includes("ai-contribution-disclosure"));m.ai_disclosure="AI disclosed";m.authors=[m.authors[1]];assert.ok(checkPublished({manifest:m}).failures.includes("human-accountability"))});
test("a mismatched artifact digest refuses public status",()=>{const r=checkPublished({manifest:published(),artifactReceipts:[{...receipt[0],sha256:"c".repeat(64)}],publicReceipt});assert.equal(r.flags.releaseReceived,false)});
test("unsafe paths and nonpublic source pointers fail",()=>{const m=candidate();m.files={"../escape.pdf":{sha256:H,bytes:1}};m.source_manuscripts=["http://localhost/source"];const r=checkPublished({manifest:m});assert.ok(r.failures.includes("declared-artifacts"));assert.ok(r.failures.includes("source-locators"))});
test("empty input fails",()=>assert.equal(check().status,"invalid-candidate"));

import {assessProspectiveSimulationEvidence as assessStudy} from "../src/publication-readiness.mjs";
{
 const HS="a".repeat(64),JS="b".repeat(64),KS="c".repeat(64),LS="d".repeat(64),MS="e".repeat(64),host="https://example.org/";
 const studyPlan=()=>({kind:"lenticule.open-science-study/v1",sourceWork:host+"work/13",scienceOwner:"Governance Science",method:"confirmatory-simulation",protocol:{url:host+"protocol.md",sha256:HS},analysisPlan:{url:host+"analysis.md",sha256:JS},design:{assignmentUnit:"colony",treatmentArms:["office","action"],estimand:"difference in false authority admission",primaryOutcome:"accepted useful Work",rivalHypothesis:"office coordination is faster",assignmentRule:"randomized entire colonies",missingnessRule:"complete count of failures",stopRule:"fixed count per cell",negativeControls:["no-coupling","spoofed-mandate"]},rights:{access:"metadata-only",authority:"Science rights review",rationale:"protect trace contents"}});
 const frozen=()=>[{kind:"study-protocol",sha256:HS,verified:true,observedAt:"2026-10-23T17:00:00Z"},{kind:"analysis-plan",sha256:JS,verified:true,observedAt:"2026-10-23T17:00:00Z"}];
 const run=()=>({runId:"study-run-1",producer:"actor:a",softwareRevision:"commit-123",startedAt:"2026-10-23T18:00:00Z",completedAt:"2026-10-23T19:00:00Z",protocolSha256:HS,analysisSha256:JS,traceSha256:KS,resultsSha256:LS,dataSha256:MS,codeSha256:HS,counts:{assignedUnits:8,completedUnits:6,failedUnits:1,abortedUnits:1},allocatedArms:{office:4,action:4},dispositionByArm:{office:{assignedUnits:4,completedUnits:4,failedUnits:0,abortedUnits:0},action:{assignedUnits:4,completedUnits:2,failedUnits:1,abortedUnits:1}},controls:[{id:"no-coupling",disposition:"passed",traceSha256:KS},{id:"spoofed-mandate",disposition:"passed",traceSha256:LS}]});
 const receive=()=>({verified:true,receiver:"actor:independent",runId:"study-run-1",traceSha256:KS,resultsSha256:LS,protocolSha256:HS,analysisSha256:JS,replayOutcome:"matched",replayedUnits:4,controlsReviewed:true,observedAt:"2026-10-23T20:00:00Z"});
 const ready=()=>({plan:studyPlan(),freezeReceipts:frozen(),run:run(),independentReceipt:receive()});
 test("open-science: rejects missing study plan",()=>assert.equal(assessStudy().status,"invalid-plan"));
 test("open-science: proposed design cannot claim run or registration",()=>{const r=assessStudy({plan:studyPlan()});assert.equal(r.status,"plan-awaits-independent-freeze");assert.equal(r.flags.externalRegistration,false)});
 test("open-science: source-frozen design is not execution",()=>{const r=assessStudy({plan:studyPlan(),freezeReceipts:frozen()});assert.equal(r.status,"frozen-plan-awaiting-run");assert.equal(r.flags.runRecorded,false)});
 test("open-science: complete independent replay receipts match bounded colony trial",()=>{const r=assessStudy(ready());assert.equal(r.status,"independent-replay-receipt-consistent");assert.equal(r.flags.independentReplay,true);assert.equal(r.assignedUnits,8)});
 test("open-science: self-review cannot count as independent",()=>{const v=ready();v.independentReceipt.receiver="actor:a";assert.equal(assessStudy(v).flags.independentReplay,false)});
 test("open-science: outcome-before-freeze is retrospective",()=>{const v=ready();v.freezeReceipts[1].observedAt="2026-10-23T18:30:00Z";assert.equal(assessStudy(v).status,"retrospective-run-not-confirmatory")});
 test("open-science: mismatched arm allocations reject run",()=>{const v=ready();v.run.allocatedArms.office=5;assert.equal(assessStudy(v).status,"run-record-incomplete")});
 test("open-science: missing population denominator rejects run",()=>{const v=ready();v.run.counts.failedUnits=2;assert.equal(assessStudy(v).flags.runRecorded,false)});
 test("open-science: incomplete negative-control histories remain incomplete",()=>{const v=ready();v.run.controls.pop();assert.equal(assessStudy(v).status,"negative-controls-not-qualified")});
 test("open-science: failed control is kept, not turned into an empirical finding",()=>{const v=ready();v.run.controls[0].disposition="failed";const r=assessStudy(v);assert.equal(r.status,"failed-negative-controls");assert.equal(r.flags.runRecorded,true)});
 test("open-science: replay digest mismatch cannot be received",()=>{const v=ready();v.independentReceipt.resultsSha256="f".repeat(64);assert.equal(assessStudy(v).flags.independentReplay,false)});
 test("open-science: external registration needs a separate consistent receipt",()=>{const v=ready();v.registrationReceipt={verified:true,url:host+"registry/1",observedAt:"2026-10-23T17:10:00Z",protocolSha256:HS,analysisSha256:JS};assert.equal(assessStudy(v).flags.externalRegistration,true);v.registrationReceipt.protocolSha256=JS;assert.equal(assessStudy(v).flags.externalRegistration,false)});
 test("open-science: protected data may have honest metadata-only accessibility",()=>assert.equal(assessStudy(ready()).rightsAccess,"metadata-only"));
 test("open-science: never manufacture a run from manuscript-only input",()=>{const v=ready();v.run=null;assert.equal(assessStudy(v).status,"frozen-plan-awaiting-run")});
 test("open-science: duplicate treatment identities are not a valid design",()=>{const v=ready();v.plan.design.treatmentArms=["office","office"];assert.equal(assessStudy(v).status,"invalid-plan")});
 test("open-science: unassayed control is distinct from failed control",()=>{const v=ready();v.run.controls[0].disposition="unassayed";assert.equal(assessStudy(v).status,"negative-controls-unassayed")});
 test("open-science: non-offset/natural-language timestamps are refused",()=>{const v=ready();v.freezeReceipts[0].observedAt="October 23, 2026";assert.equal(assessStudy(v).flags.planFrozen,false)});
 test("open-science: aggregate trial totals without arm dispositions refuse a run",()=>{
   const v=ready();delete v.run.dispositionByArm;const x=assessStudy(v);
   assert.equal(x.status,"run-record-incomplete");assert.equal(x.flags.denominatorReconciled,false);
   assert.ok(x.failures.includes("per-arm-disposition-missing-or-inconsistent"));
 });
 test("open-science: incomplete treatment-arm trial denominator refuses confirmation",()=>{
   const v=ready();v.run.dispositionByArm.action.completedUnits=3;const x=assessStudy(v);
   assert.equal(x.status,"run-record-incomplete");assert.equal(x.flags.runRecorded,false);
 });
 test("open-science: per-arm missingness cannot be masked by matching global totals",()=>{
   const v=ready();v.run.dispositionByArm.office.failedUnits=1;
   v.run.dispositionByArm.action.failedUnits=0;
   assert.equal(assessStudy(v).status,"run-record-incomplete");
 });
 test("open-science: extra unregistered arm is refused",()=>{
   const v=ready();v.run.dispositionByArm.unregistered={assignedUnits:0,completedUnits:0,failedUnits:0,abortedUnits:0};
   assert.equal(assessStudy(v).flags.runRecorded,false);
 });
 test("open-science: an arm with no surviving completions remains visible, not dropped",()=>{
   const v=ready();
   v.run.dispositionByArm.action={assignedUnits:4,completedUnits:0,failedUnits:3,abortedUnits:1};
   v.run.counts={assignedUnits:8,completedUnits:4,failedUnits:3,abortedUnits:1};
   const x=assessStudy(v);
   assert.equal(x.flags.runRecorded,true);
   assert.equal(x.reportedDispositionByArm.action.completedUnits,0);
   assert.equal(x.reportedDispositionByArm.office.completedUnits,4);
 });
 test("open-science: first-class arm accounting does not itself certify inference",()=>{
   const x=assessStudy(ready());
   assert.equal(x.flags.denominatorReconciled,true);
   assert.equal(x.reportedDispositionByArm.action.failedUnits,1);
   assert.equal(x.limit.includes("scientific inference"),true);
 });
 test("open-science: arm accounting cannot inherit a forged prototype arm",()=>{
   const v=ready();v.plan.design.treatmentArms=["office","__proto__"];
   v.run.allocatedArms={office:4,action:4};
   assert.equal(assessStudy(v).flags.runRecorded,false);
 });


}

test("publication: a public observation before declared release cannot establish citability",()=>{
 const m=published();m.released_at="2026-10-30T00:00:00Z";
 const observed={...publicReceipt,observedAt:"2026-10-29T23:59:59Z"};
 const result=checkPublished({manifest:m,artifactReceipts:receipt,publicReceipt:observed});
 assert.equal(result.status,"public-claim-unreceived");assert.equal(result.releaseChronology,"pre-release-observation");
 assert.equal(result.flags.artifactBytesVerified,true);assert.equal(result.flags.publiclyCitable,false);
 m.doi="10.5281/zenodo.123456";
 const doi={verified:true,doi:m.doi,version:m.version,publicUrl:U};
 assert.equal(checkPublished({manifest:m,artifactReceipts:receipt,publicReceipt:observed,doiReceipt:doi}).flags.doiReceived,false);
});
test("publication: offset-equivalent release and observation instants compare correctly",()=>{
 const m=published();m.released_at="2026-10-18T01:00:00+01:00";
 const observed={...publicReceipt,observedAt:"2026-10-18T00:00:00Z"};
 const result=checkPublished({manifest:m,artifactReceipts:receipt,publicReceipt:observed});
 assert.equal(result.releaseChronology,"ordered");assert.equal(result.status,"public-release-received");
});
test("publication: natural-language release or observation timestamps cannot qualify a public receipt",()=>{
 const m=published();m.released_at="October 18 2026";
 const result=checkPublished({manifest:m,artifactReceipts:receipt,publicReceipt});
 assert.equal(result.releaseChronology,"unqualified");assert.equal(result.flags.publiclyCitable,false);
 m.released_at="2026-10-18T00:00:00Z";
 assert.equal(checkPublished({manifest:m,artifactReceipts:receipt,
 publicReceipt:{...publicReceipt,observedAt:"October 18 2026"}}).flags.releaseReceived,false);
});
test("publication: conflicting artifact evidence is order-independent and non-citable",()=>{
 const bad={...receipt[0],sha256:"c".repeat(64)};
 const output=[];
 for(const rows of [[bad,receipt[0]],[receipt[0],bad]]){
   const r=checkPublished({manifest:published(),artifactReceipts:rows,publicReceipt});
   assert.equal(r.status,"metadata-ready-artifacts-unverified");
   assert.equal(r.flags.publiclyCitable,false);
   assert.deepEqual(r.receiptEvidence.duplicatePaths,["paper.pdf"]);
   assert.deepEqual(r.receiptEvidence.contradictoryPaths,["paper.pdf"]);
   assert.deepEqual(r.receiptEvidence.mismatchedPaths,["paper.pdf"]);
   output.push(r.receiptEvidence);
 }
 assert.deepEqual(output[0],output[1]);
});
test("publication: duplicate identical receipts do not manufacture independent verification",()=>{
 const r=checkPublished({manifest:published(),artifactReceipts:[receipt[0],{...receipt[0]}],publicReceipt});
 assert.equal(r.flags.artifactBytesVerified,false);
 assert.deepEqual(r.receiptEvidence.duplicatePaths,["paper.pdf"]);
 assert.deepEqual(r.receiptEvidence.contradictoryPaths,[]);
});
test("publication: undeclared, malformed and absent receipts are visible as incomplete",()=>{
 for(const rows of [[receipt[0],{path:"extra.json",sha256:H,bytes:10,verified:true}],[receipt[0],null]]){
   const r=checkPublished({manifest:published(),artifactReceipts:rows,publicReceipt});
   assert.equal(r.flags.releaseReceived,false);assert.equal(r.flags.artifactBytesVerified,false);
 }
 const absent=checkPublished({manifest:published(),artifactReceipts:[],publicReceipt});
 assert.deepEqual(absent.receiptEvidence.missingPaths,["paper.pdf"]);
});
test("publication: an exact multi-artifact receipt inventory accepts either order",()=>{
 const m=published();m.files["results.json"]={sha256:"c".repeat(64),bytes:4};
 const results={path:"results.json",sha256:"c".repeat(64),bytes:4,verified:true};
 for(const rows of [[results,receipt[0]],[receipt[0],results]]){
   const r=checkPublished({manifest:m,artifactReceipts:rows,publicReceipt});
   assert.equal(r.status,"public-release-received");
   assert.deepEqual(r.receiptEvidence.duplicatePaths,[]);
   assert.deepEqual(r.receiptEvidence.missingPaths,[]);
 }
});


test("publication: a claimed digest without actual manifest bytes cannot qualify public release",()=>{
 const m=published(),r=check({manifest:m,artifactReceipts:receipt,publicReceipt});
 assert.equal(r.status,"public-claim-unreceived");
 assert.equal(r.manifestEvidence.standing,"missing-source-bytes");
 assert.equal(r.flags.publiclyCitable,false);
});
test("publication: exact source manifest bytes must match the version and claimed digest",()=>{
 const m=published(),{manifestBytes,manifestSha256}=sourceEvidence(m);
 const correct={...publicReceipt,manifestSha256};
 assert.equal(check({manifest:m,artifactReceipts:receipt,manifestBytes,publicReceipt:correct}).status,"public-release-received");
 const falseDigest=check({manifest:m,artifactReceipts:receipt,manifestBytes,
   publicReceipt:{...correct,manifestSha256:"f".repeat(64)}});
 assert.equal(falseDigest.status,"public-claim-unreceived");
 assert.equal(falseDigest.manifestEvidence.standing,"receipt-digest-mismatch");
 const differentBytes=Buffer.from(JSON.stringify({...m,title:"Another manuscript"}),"utf8");
 const wrongVersion=check({manifest:m,artifactReceipts:receipt,manifestBytes:differentBytes,
   publicReceipt:{...correct,manifestSha256:createHash("sha256").update(differentBytes).digest("hex")}});
 assert.equal(wrongVersion.manifestEvidence.standing,"source-does-not-match-manifest");
 assert.equal(wrongVersion.flags.releaseReceived,false);
});
test("publication: malformed, oversized, missing or invalid UTF-8 source refuses promotion",()=>{
 const m=published(),correct={...publicReceipt,manifestSha256:sourceEvidence(m).manifestSha256};
 for(const bytes of [new Uint8Array(),Buffer.from("{invalid"),Buffer.from([0xff,0xfe]),new Uint8Array(2_000_001)]){
  const r=check({manifest:m,artifactReceipts:receipt,manifestBytes:bytes,publicReceipt:correct});
  assert.equal(r.flags.releaseReceived,false);
  assert.match(r.manifestEvidence.standing,/invalid-/);
 }
});
test("publication: reserialized JSON whitespace is allowed but its exact digest must be used",()=>{
 const m=published(),manifestBytes=Buffer.from(JSON.stringify(m,null,2)+"\n","utf8");
 const correct={...publicReceipt,manifestSha256:createHash("sha256").update(manifestBytes).digest("hex")};
 const r=check({manifest:m,artifactReceipts:receipt,manifestBytes,publicReceipt:correct});
 assert.equal(r.status,"public-release-received");
 assert.equal(r.manifestEvidence.bytes,manifestBytes.length);
});
test("publication: DOI requires verified time and binding to the same manifest version",()=>{
 const m=published();m.doi="10.5281/zenodo.123456";
 const {manifestBytes,manifestSha256}=sourceEvidence(m);
 const pub={...publicReceipt,manifestSha256},good=doiEvidence(m);
 assert.equal(check({manifest:m,manifestBytes,artifactReceipts:receipt,publicReceipt:pub,doiReceipt:good}).status,"doi-received");
 for(const changed of [
  {...good,observedAt:undefined},
  {...good,observedAt:"2026-10-17T23:59:59Z"},
  {...good,observedAt:"October 18 2026"},
  {...good,manifestSha256:"c".repeat(64)}
 ]){
  const r=check({manifest:m,manifestBytes,artifactReceipts:receipt,publicReceipt:pub,doiReceipt:changed});
  assert.equal(r.status,"public-release-received");
  assert.equal(r.flags.doiReceived,false);
 }
 assert.equal(check({manifest:m,manifestBytes,artifactReceipts:receipt,publicReceipt:pub,
  doiReceipt:{...good,observedAt:"2026-10-17T23:59:59Z"}}).doiChronology,"pre-release-observation");
});
test("publication: impossible Gregorian civil dates refuse release chronology, leap day passes",()=>{
 const m=published();
 for(const date of ["2026-02-30T00:00:00Z","2026-04-31T00:00:00Z","2026-02-29T00:00:00Z"]){
  m.released_at=date;
  const {manifestBytes,manifestSha256}=sourceEvidence(m);
  const r=check({manifest:m,artifactReceipts:receipt,manifestBytes,
   publicReceipt:{...publicReceipt,manifestSha256,observedAt:"2026-05-01T00:00:00Z"}});
  assert.equal(r.releaseChronology,"unqualified");
  assert.equal(r.flags.publiclyCitable,false);
 }
 m.released_at="2028-02-29T00:00:00Z";
 const {manifestBytes,manifestSha256}=sourceEvidence(m);
 const accepted=check({manifest:m,artifactReceipts:receipt,manifestBytes,
   publicReceipt:{...publicReceipt,manifestSha256,observedAt:"2028-02-29T00:00:00Z"}});
 assert.equal(accepted.status,"public-release-received");
});
