/** Read-only structural admission; a citation file cannot itself create a release or DOI. */
const isObj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x),has=x=>typeof x==="string"&&x.trim().length>0;
const hash=/^[a-f0-9]{64}$/u,ver=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\w.-]+)?$/u,doi=/^10\.\d{4,9}\/\S+$/iu;
const https=x=>{if(!has(x))return false;try{const u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password&&!!u.hostname}catch{return false}};
const outcome=(status,failures,flags,info={})=>Object.freeze({kind:"research-paper-release-readiness/v1",status,failures:Object.freeze([...failures]),flags:Object.freeze({...flags}),...info,limit:"Structural and receipt consistency only; not scientific truth, rights clearance, archiving, DOI registration, public availability, or newsroom delivery."});
/** The caller supplies independently byte-verified artifact and live-release receipts.
 * No filesystem, network, signing, DOI allocation, or publication effect occurs here. */
export function assessResearchPublicationReadiness({manifest,artifactReceipts=[],publicReceipt=null,doiReceipt=null}={}){
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
 const valid=missing.length===0,byPath=new Map((Array.isArray(artifactReceipts)?artifactReceipts:[]).map(x=>[x?.path,x]));
 const artifactsVerified=valid&&files.every(([p,v])=>{const r=byPath.get(p);return r?.verified===true&&r.sha256===v.sha256&&r.bytes===v.bytes});
 const publicFields=manifest.status==="published"&&https(manifest.canonical_public_url)&&has(manifest.released_at)&&Number.isFinite(Date.parse(manifest.released_at));
 const releaseReceived=!!(artifactsVerified&&publicFields&&isObj(publicReceipt)&&publicReceipt.verified===true&&publicReceipt.publicUrl===manifest.canonical_public_url&&publicReceipt.version===manifest.version&&has(publicReceipt.observedAt)&&Number.isFinite(Date.parse(publicReceipt.observedAt))&&hash.test(publicReceipt.manifestSha256??""));
 const doiReceived=!!(releaseReceived&&has(manifest.doi)&&doi.test(manifest.doi)&&isObj(doiReceipt)&&doiReceipt.verified===true&&doiReceipt.doi===manifest.doi&&doiReceipt.version===manifest.version&&doiReceipt.publicUrl===manifest.canonical_public_url);
 const status=!valid?"invalid-candidate":!artifactsVerified?"metadata-ready-artifacts-unverified":manifest.status!=="published"?"reproducible-candidate-not-public":!releaseReceived?"public-claim-unreceived":doiReceived?"doi-received":"public-release-received";
 return outcome(status,missing,{sourceReady:valid,artifactBytesVerified:artifactsVerified,releaseReceived,doiReceived,publiclyCitable:releaseReceived},{version:manifest.version??null,publicUrl:releaseReceived?manifest.canonical_public_url:null,doi:doiReceived?manifest.doi:null});
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
 const timed=x=>has(x)&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/u.test(x)&&Number.isFinite(Date.parse(x));
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
 const number=x=>Number.isSafeInteger(x)&&x>=0;
 const assigned=ct.assignedUnits,completed=ct.completedUnits,failed=ct.failedUnits,aborted=ct.abortedUnits;
 const arms=Array.isArray(design.treatmentArms)?design.treatmentArms:[];
 const countsValid=number(assigned)&&assigned>0&&[completed,failed,aborted].every(number)&&completed+failed+aborted===assigned;
 const allocationsValid=arms.length>=2&&Object.keys(alloc).length===arms.length&&arms.every(k=>number(alloc[k])&&alloc[k]>0)&&arms.reduce((sum,k)=>sum+alloc[k],0)===assigned;
 const runRecorded=designQualified&&!!runObj&&has(runObj.runId)&&has(runObj.producer)&&has(runObj.softwareRevision)&&digested(runObj.traceSha256)&&digested(runObj.resultsSha256)&&digested(runObj.dataSha256)&&digested(runObj.codeSha256)&&runObj.protocolSha256===protocol.sha256&&runObj.analysisSha256===analysis.sha256&&timed(runObj.startedAt)&&timed(runObj.completedAt)&&Date.parse(runObj.startedAt)<Date.parse(runObj.completedAt)&&countsValid&&allocationsValid;
 const prospective=!!(planFrozen&&runRecorded&&Date.parse(protocolFreeze.observedAt)<=Date.parse(runObj.startedAt)&&Date.parse(analysisFreeze.observedAt)<=Date.parse(runObj.startedAt));
 const controlRows=Array.isArray(runObj?.controls)?runObj.controls:[];
 const controlsComplete=runRecorded&&list(design.negativeControls)&&design.negativeControls.every(id=>controlRows.filter(r=>r?.id===id&&["passed","failed","unassayed"].includes(r.disposition)&&digested(r.traceSha256)).length===1)&&controlRows.length===design.negativeControls.length;
 const controlsAssayed=!!(controlsComplete&&controlRows.every(r=>r.disposition!=="unassayed"));
 const controlsPassed=!!(controlsAssayed&&controlRows.every(r=>r.disposition==="passed"));
 const independentReplay=!!(prospective&&controlsPassed&&isObj(independentReceipt)&&independentReceipt.verified===true&&has(independentReceipt.receiver)&&independentReceipt.receiver!==runObj.producer&&independentReceipt.runId===runObj.runId&&independentReceipt.traceSha256===runObj.traceSha256&&independentReceipt.resultsSha256===runObj.resultsSha256&&independentReceipt.protocolSha256===protocol.sha256&&independentReceipt.analysisSha256===analysis.sha256&&independentReceipt.replayOutcome==="matched"&&Number.isSafeInteger(independentReceipt.replayedUnits)&&independentReceipt.replayedUnits>0&&independentReceipt.controlsReviewed===true&&timed(independentReceipt.observedAt)&&Date.parse(independentReceipt.observedAt)>=Date.parse(runObj.completedAt));
 const externalRegistration=!!(planFrozen&&isObj(registrationReceipt)&&registrationReceipt.verified===true&&https(registrationReceipt.url)&&timed(registrationReceipt.observedAt)&&registrationReceipt.protocolSha256===protocol.sha256&&registrationReceipt.analysisSha256===analysis.sha256&&(!runObj||(timed(runObj.startedAt)&&Date.parse(registrationReceipt.observedAt)<=Date.parse(runObj.startedAt))));
 if(designQualified&&!planFrozen)failures.push("independent-protocol-and-analysis-freeze-receipts");
 if(designQualified&&run!==null&&!runRecorded)failures.push("run-provenance-denominator-or-treatment-coverage");
 if(planFrozen&&runRecorded&&!prospective)failures.push("freeze-after-run-start");
 if(runRecorded&&!controlsComplete)failures.push("missing-or-unassayed-negative-controls");
 if(controlsComplete&&!controlsAssayed)failures.push("negative-control-unassayed");
 if(controlsAssayed&&!controlsPassed)failures.push("negative-control-failure");
 if(prospective&&controlsPassed&&!independentReplay)failures.push("independent-replay-not-received");
 const status=!designQualified?"invalid-plan":!planFrozen?"plan-awaits-independent-freeze":run===null?"frozen-plan-awaiting-run":!runRecorded?"run-record-incomplete":!prospective?"retrospective-run-not-confirmatory":!controlsComplete?"negative-controls-not-qualified":!controlsAssayed?"negative-controls-unassayed":!controlsPassed?"failed-negative-controls":!independentReplay?"awaiting-independent-replay":"independent-replay-receipt-consistent";
 return result(status,{designQualified,planFrozen,prospective,runRecorded,controlsPassed,independentReplay,externalRegistration},{studyId:plan.sourceWork,assignmentUnit:has(design.assignmentUnit)?design.assignmentUnit:null,assignedUnits:runRecorded?assigned:null,rightsAccess:rights.access??null});
}
