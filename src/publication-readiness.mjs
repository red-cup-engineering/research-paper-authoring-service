/** Read-only structural admission; a citation file cannot itself create a release or DOI. */
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
const isObj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x),has=x=>typeof x==="string"&&x.trim().length>0;
const hash=/^[a-f0-9]{64}$/u,ver=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\w.-]+)?$/u,doi=/^10\.\d{4,9}\/\S+$/iu;
const https=x=>{if(!has(x))return false;try{const u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password&&!!u.hostname}catch{return false}};
const qualifiedInstant=x=>{
 if(!has(x))return false;
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/u.exec(x);
 if(!m)return false;
 const [,y,mo,d,h,minute,second,,zoneHour,zoneMinute]=m;
 const year=Number(y),month=Number(mo),day=Number(d);
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(year<1||month<1||month>12||day<1||day>days[month-1]||
    Number(h)>23||Number(minute)>59||Number(second)>59||
    (zoneHour!==undefined&&(Number(zoneHour)>23||Number(zoneMinute)>59)))return false;
 return Number.isFinite(Date.parse(x));
};
const MAX_MANIFEST_BYTES=2_000_000;
/** Bind a receipt to the exact original UTF-8 JSON manifest bytes, not just
 * to the receiver's unsupported 64-hex statement. Still not an authenticity
 * claim: the caller must independently verify publication URL and signer. */
function examineManifestBytes(manifest,manifestBytes,claimedSha256){
 const report=(standing,sha256=null,bytes=null)=>Object.freeze({standing,sha256,bytes});
 if(manifestBytes===null||manifestBytes===undefined)return report("missing-source-bytes");
 if(!(manifestBytes instanceof Uint8Array)||manifestBytes.byteLength===0||
    manifestBytes.byteLength>MAX_MANIFEST_BYTES)return report("invalid-source-bytes");
 let decoded;
 try{decoded=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(manifestBytes))}
 catch{return report("invalid-source-json-or-encoding")}
 if(!isDeepStrictEqual(decoded,manifest))return report("source-does-not-match-manifest");
 const sha256=createHash("sha256").update(manifestBytes).digest("hex");
 return report(hash.test(claimedSha256??"")&&sha256===claimedSha256?"bound":"receipt-digest-mismatch",
   sha256,manifestBytes.byteLength);
}
const outcome=(status,failures,flags,info={})=>Object.freeze({kind:"research-paper-release-readiness/v1",status,failures:Object.freeze([...failures]),flags:Object.freeze({...flags}),...info,limit:"Structural and receipt consistency only; not scientific truth, rights clearance, archiving, DOI registration, public availability, or newsroom delivery."});
/** The caller supplies independently byte-verified artifact and live-release receipts.
 * No filesystem, network, signing, DOI allocation, or publication effect occurs here. */
export function assessResearchPublicationReadiness({manifest,manifestBytes=null,artifactReceipts=[],publicReceipt=null,doiReceipt=null}={}){
 const missing=[],required=(k,p)=>{if(!p)missing.push(k);return p};
 if(!isObj(manifest))return outcome("invalid-candidate",["manifest-required"],{sourceReady:false,artifactBytesVerified:false,releaseReceived:false,doiReceived:false});
 required("publication-kind",["lenticule.research-publication.v1","research-publication/v1"].includes(manifest.kind));
 required("title",has(manifest.title));required("version",has(manifest.version)&&ver.test(manifest.version));
 required("status",["draft","release-candidate","published"].includes(manifest.status));
 required("discipline",has(manifest.discipline));required("publisher",has(manifest.publishing_organization));
 const authors=Array.isArray(manifest.authors)?manifest.authors:[];
 required("authors",authors.length>0&&authors.every(x=>isObj(x)&&has(x.name)&&has(x.role))&&new Set(authors.map(x=>x.name)).size===authors.length);
 required("human-accountability",authors.some(x=>/human|accountable/iu.test(x.role??"")&&!/\bai\b|model/iu.test(x.role??"")));
 const ai=authors.some(x=>/\bai\b|model|codex|gpt/iu.test(x.role??""));
 required("ai-contribution-disclosure",!ai||(has(manifest.ai_disclosure)&&/ai|model|assistant/iu.test(manifest.ai_disclosure)));
 required("hypotheses-and-evidence-status",isObj(manifest.evidence)&&Object.keys(manifest.evidence).length>0&&Object.values(manifest.evidence).every(has));
 const files=isObj(manifest.files)?Object.entries(manifest.files):[];
 required("declared-artifacts",files.some(([p])=>/\.pdf$/iu.test(p))&&files.every(([p,v])=>has(p)&&!p.startsWith("/")&&!p.split("/").includes("..")&&isObj(v)&&hash.test(v.sha256??"")&&Number.isSafeInteger(v.bytes)&&v.bytes>0));
 required("source-locators",Array.isArray(manifest.source_manuscripts)&&manifest.source_manuscripts.length>0&&manifest.source_manuscripts.every(https));
 // All receipts are original testimony. Never discard an inconsistent receipt
 // by Map last-write-wins or certify a publication from input ordering.
 const valid=missing.length===0,receipts=Array.isArray(artifactReceipts)?artifactReceipts:[];
 const byPath=new Map(),rowsByPath=new Map(),duplicates=new Set(),contradictions=new Set();
 let malformedCount=0;
 for(const row of receipts){
   if(!isObj(row)||!has(row.path)){malformedCount++;continue}
   if(!rowsByPath.has(row.path))rowsByPath.set(row.path,[]);
   rowsByPath.get(row.path).push(row);
   if(byPath.has(row.path)){
     duplicates.add(row.path);
     const earlier=byPath.get(row.path);
     if(earlier.sha256!==row.sha256||earlier.bytes!==row.bytes||earlier.verified!==row.verified)
       contradictions.add(row.path);
   }else byPath.set(row.path,row);
 }
 const fileNames=new Set(files.map(([path])=>path));
 const undeclared=[...byPath.keys()].filter(path=>!fileNames.has(path)).sort();
 const missingReceipts=files.map(([path])=>path).filter(path=>!byPath.has(path)).sort();
 const mismatched=files.filter(([path,v])=>(rowsByPath.get(path)??[])
   .some(row=>!(row.verified===true&&row.sha256===v.sha256&&row.bytes===v.bytes)))
   .map(([path])=>path).sort();
 const receiptEvidence=Object.freeze({
   malformedCount,duplicatePaths:Object.freeze([...duplicates].sort()),
   contradictoryPaths:Object.freeze([...contradictions].sort()),
   undeclaredPaths:Object.freeze(undeclared),missingPaths:Object.freeze(missingReceipts),
   mismatchedPaths:Object.freeze(mismatched),
 });
 const exactInventory=malformedCount===0&&duplicates.size===0&&undeclared.length===0
   &&missingReceipts.length===0&&receipts.length===files.length;
 const artifactsVerified=valid&&exactInventory&&mismatched.length===0;
 // A claimed publication cannot have been independently observed before
 // the claimed release instant, regardless of any supplied verified flags.
 const manifestEvidence=examineManifestBytes(manifest,manifestBytes,publicReceipt?.manifestSha256);
 const releaseChronology=!isObj(publicReceipt)?"unobserved"
   :!qualifiedInstant(manifest.released_at)||!qualifiedInstant(publicReceipt.observedAt)?"unqualified"
   :Date.parse(publicReceipt.observedAt)<Date.parse(manifest.released_at)?"pre-release-observation":"ordered";
 const publicFields=manifest.status==="published"&&https(manifest.canonical_public_url)&&qualifiedInstant(manifest.released_at);
 const releaseReceived=!!(artifactsVerified&&publicFields&&releaseChronology==="ordered"
   &&manifestEvidence.standing==="bound"
   &&publicReceipt.verified===true&&publicReceipt.publicUrl===manifest.canonical_public_url
   &&publicReceipt.version===manifest.version&&hash.test(publicReceipt.manifestSha256??""));
 const doiChronology=!isObj(doiReceipt)?"unobserved"
   :!qualifiedInstant(manifest.released_at)||!qualifiedInstant(doiReceipt.observedAt)?"unqualified"
   :Date.parse(doiReceipt.observedAt)<Date.parse(manifest.released_at)?"pre-release-observation":"ordered";
 const doiReceived=!!(releaseReceived&&has(manifest.doi)&&doi.test(manifest.doi)&&isObj(doiReceipt)
   &&doiChronology==="ordered"&&doiReceipt.verified===true
   &&doiReceipt.doi===manifest.doi&&doiReceipt.version===manifest.version
   &&doiReceipt.publicUrl===manifest.canonical_public_url
   &&doiReceipt.manifestSha256===manifestEvidence.sha256);
 const status=!valid?"invalid-candidate":!artifactsVerified?"metadata-ready-artifacts-unverified":manifest.status!=="published"?"reproducible-candidate-not-public":!releaseReceived?"public-claim-unreceived":doiReceived?"doi-received":"public-release-received";
 return outcome(status,missing,{sourceReady:valid,artifactBytesVerified:artifactsVerified,releaseReceived,doiReceived,publiclyCitable:releaseReceived},{version:manifest.version??null,publicUrl:releaseReceived?manifest.canonical_public_url:null,doi:doiReceived?manifest.doi:null,receiptEvidence,manifestEvidence,releaseChronology,doiChronology});
}

/** Structural study-to-replay evidence assay. It cannot authenticate providers, execute
 * an experiment, certify scientific truth, grant rights, or perform preregistration.
 *
 * Narrow scope: confirmatory synthetic-colony simulations. Other research methods use
 * their own scientifically appropriate admissions rather than fake treatment arms.
 * Supplied freeze, run, and independent receipts must be authenticated by the caller.
 */
export function assessProspectiveSimulationEvidence({plan,freezeReceipts=[],run=null,independentReceipt=null,registrationReceipt=null}={}){
 const failures=[];
 const required=(name,ok)=>{if(!ok)failures.push(name);return ok};
 const timed=qualifiedInstant;
 const digested=x=>typeof x==="string"&&hash.test(x);
 const list=x=>Array.isArray(x)&&x.length>0&&x.every(has)&&new Set(x).size===x.length;
 const result=(status,flags,more={})=>Object.freeze({kind:"open-science-simulation-evidence/v1",status,failures:Object.freeze([...failures]),flags:Object.freeze({...flags}),...more,limit:"Checks supplied records for source, chronology and receipt consistency only. No provider authentication, simulation execution, scientific inference, rights clearance, external preregistration, or public release is performed."});
 if(!isObj(plan))return result("invalid-plan",{designQualified:false,planFrozen:false,prospective:false,runRecorded:false,controlsPassed:false,independentReplay:false,externalRegistration:false});
 required("study-kind",plan.kind==="lenticule.open-science-study/v1");
 required("source-work",https(plan.sourceWork));
 required("science-owner",has(plan.scienceOwner));
 required("study-method",plan.method==="confirmatory-simulation");
 const protocol=isObj(plan.protocol)?plan.protocol:{},analysis=isObj(plan.analysisPlan)?plan.analysisPlan:{},design=isObj(plan.design)?plan.design:{},rights=isObj(plan.rights)?plan.rights:{};
 required("protocol-source",https(protocol.url)&&digested(protocol.sha256));
 required("analysis-plan-source",https(analysis.url)&&digested(analysis.sha256));
 required("assignment-unit",has(design.assignmentUnit));
 required("treatment-arms",list(design.treatmentArms)&&design.treatmentArms.length>=2);
 required("primary-estimand",has(design.estimand));
 required("primary-outcome",has(design.primaryOutcome));
 required("alternative-explanation",has(design.rivalHypothesis));
 required("assignment-rule",has(design.assignmentRule));
 required("missingness-rule",has(design.missingnessRule));
 required("stop-rule",has(design.stopRule));
 required("negative-controls",list(design.negativeControls));
 required("rights-and-availability",["public","restricted","metadata-only"].includes(rights.access)&&has(rights.authority)&&has(rights.rationale));
 const designQualified=failures.length===0;
 const freezes=Array.isArray(freezeReceipts)?freezeReceipts:[];
 const frozen=(kind,sha)=>freezes.filter(r=>r?.kind===kind&&r.verified===true&&r.sha256===sha&&timed(r.observedAt));
 const protocolFreeze=frozen("study-protocol",protocol.sha256)[0],analysisFreeze=frozen("analysis-plan",analysis.sha256)[0];
 const planFrozen=designQualified&&!!protocolFreeze&&!!analysisFreeze;
 const runObj=isObj(run)?run:null,ct=isObj(runObj?.counts)?runObj.counts:{},alloc=isObj(runObj?.allocatedArms)?runObj.allocatedArms:{};
 const byArm=isObj(runObj?.dispositionByArm)?runObj.dispositionByArm:{};
 const number=x=>Number.isSafeInteger(x)&&x>=0;
 const assigned=ct.assignedUnits,completed=ct.completedUnits,failed=ct.failedUnits,aborted=ct.abortedUnits;
 const arms=Array.isArray(design.treatmentArms)?design.treatmentArms:[];
 const countsValid=number(assigned)&&assigned>0&&[completed,failed,aborted].every(number)&&completed+failed+aborted===assigned;
 const allocationsValid=arms.length>=2&&Object.keys(alloc).length===arms.length&&arms.every(k=>Object.hasOwn(alloc,k)&&number(alloc[k])&&alloc[k]>0)&&arms.reduce((sum,k)=>sum+alloc[k],0)===assigned;
 // An aggregate denominator can conceal systematic loss of one assigned colony arm.
 // All counts are observations supplied by the host, not verified experiments.
 const dispositionFields=["assignedUnits","completedUnits","failedUnits","abortedUnits"];
 const perArmValid=!!(countsValid&&allocationsValid&&Object.keys(byArm).length===arms.length
   &&arms.every(k=>Object.hasOwn(byArm,k)&&isObj(byArm[k])
     &&dispositionFields.every(f=>Object.hasOwn(byArm[k],f)&&number(byArm[k][f]))
     &&byArm[k].assignedUnits===alloc[k]
     &&byArm[k].completedUnits+byArm[k].failedUnits+byArm[k].abortedUnits===byArm[k].assignedUnits)
   &&dispositionFields.every(f=>arms.reduce((sum,k)=>sum+byArm[k][f],0)===ct[f]));
 const acceptedByArm=perArmValid?Object.freeze(Object.fromEntries(arms.map(k=>[k,Object.freeze(Object.fromEntries(dispositionFields.map(field=>[field,byArm[k][field]])))]))):null;
 const runRecorded=designQualified&&!!runObj&&has(runObj.runId)&&has(runObj.producer)&&has(runObj.softwareRevision)&&digested(runObj.traceSha256)&&digested(runObj.resultsSha256)&&digested(runObj.dataSha256)&&digested(runObj.codeSha256)&&runObj.protocolSha256===protocol.sha256&&runObj.analysisSha256===analysis.sha256&&timed(runObj.startedAt)&&timed(runObj.completedAt)&&Date.parse(runObj.startedAt)<Date.parse(runObj.completedAt)&&countsValid&&allocationsValid&&perArmValid;
 const prospective=!!(planFrozen&&runRecorded&&Date.parse(protocolFreeze.observedAt)<=Date.parse(runObj.startedAt)&&Date.parse(analysisFreeze.observedAt)<=Date.parse(runObj.startedAt));
 const controlRows=Array.isArray(runObj?.controls)?runObj.controls:[];
 const controlsComplete=runRecorded&&list(design.negativeControls)&&design.negativeControls.every(id=>controlRows.filter(r=>r?.id===id&&["passed","failed","unassayed"].includes(r.disposition)&&digested(r.traceSha256)).length===1)&&controlRows.length===design.negativeControls.length;
 const controlsAssayed=!!(controlsComplete&&controlRows.every(r=>r.disposition!=="unassayed"));
 const controlsPassed=!!(controlsAssayed&&controlRows.every(r=>r.disposition==="passed"));
 const independentReplay=!!(prospective&&controlsPassed&&isObj(independentReceipt)&&independentReceipt.verified===true&&has(independentReceipt.receiver)&&independentReceipt.receiver!==runObj.producer&&independentReceipt.runId===runObj.runId&&independentReceipt.traceSha256===runObj.traceSha256&&independentReceipt.resultsSha256===runObj.resultsSha256&&independentReceipt.protocolSha256===protocol.sha256&&independentReceipt.analysisSha256===analysis.sha256&&independentReceipt.replayOutcome==="matched"&&Number.isSafeInteger(independentReceipt.replayedUnits)&&independentReceipt.replayedUnits>0&&independentReceipt.controlsReviewed===true&&timed(independentReceipt.observedAt)&&Date.parse(independentReceipt.observedAt)>=Date.parse(runObj.completedAt));
 const externalRegistration=!!(planFrozen&&isObj(registrationReceipt)&&registrationReceipt.verified===true&&https(registrationReceipt.url)&&timed(registrationReceipt.observedAt)&&registrationReceipt.protocolSha256===protocol.sha256&&registrationReceipt.analysisSha256===analysis.sha256&&(!runObj||(timed(runObj.startedAt)&&Date.parse(registrationReceipt.observedAt)<=Date.parse(runObj.startedAt))));
 if(designQualified&&!planFrozen)failures.push("independent-protocol-and-analysis-freeze-receipts");
 if(designQualified&&run!==null&&!perArmValid)failures.push("per-arm-disposition-missing-or-inconsistent");
 if(designQualified&&run!==null&&!runRecorded)failures.push("run-provenance-denominator-or-treatment-coverage");
 if(planFrozen&&runRecorded&&!prospective)failures.push("freeze-after-run-start");
 if(runRecorded&&!controlsComplete)failures.push("missing-or-unassayed-negative-controls");
 if(controlsComplete&&!controlsAssayed)failures.push("negative-control-unassayed");
 if(controlsAssayed&&!controlsPassed)failures.push("negative-control-failure");
 if(prospective&&controlsPassed&&!independentReplay)failures.push("independent-replay-not-received");
 const status=!designQualified?"invalid-plan":!planFrozen?"plan-awaits-independent-freeze":run===null?"frozen-plan-awaiting-run":!runRecorded?"run-record-incomplete":!prospective?"retrospective-run-not-confirmatory":!controlsComplete?"negative-controls-not-qualified":!controlsAssayed?"negative-controls-unassayed":!controlsPassed?"failed-negative-controls":!independentReplay?"awaiting-independent-replay":"independent-replay-receipt-consistent";
 return result(status,{designQualified,planFrozen,prospective,runRecorded,denominatorReconciled:perArmValid,controlsPassed,independentReplay,externalRegistration},{studyId:plan.sourceWork,assignmentUnit:has(design.assignmentUnit)?design.assignmentUnit:null,assignedUnits:runRecorded?assigned:null,reportedDispositionByArm:runRecorded?acceptedByArm:null,rightsAccess:rights.access??null});
}
