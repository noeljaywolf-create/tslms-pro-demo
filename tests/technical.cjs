const fs=require('fs'),vm=require('vm');const ctx=vm.createContext({console,Date,setTimeout,localStorage:{getItem:()=>null},doLogin(){}});
for(const f of ['js/core.js','js/engineering.js','js/operations.js','js/technical.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'..',f),'utf8'),ctx,{filename:f});
vm.runInContext(`
const check=(x,m)=>{if(!x)throw Error(m)};const throws=(fn,m)=>{let thrown=false;try{fn()}catch(e){thrown=true}check(thrown,m)};
const c={sn:'TEST-1',pn:'HYP-100-2',reg:'Stores',position:'Receiving',condition:'Quarantined',hours:10,cycles:2,flights:2,totalHours:100,totalCycles:20,totalFlights:20,hLimit:1000,cLimit:100,fLimit:100,retireHours:5000,retireCycles:1000,due:relativeDate(60),lastOverhaul:relativeDate(-10),release:'DEMO-REF',originJob:'WO-TEST'};
check(validateReceipt(c,[]),'valid receipt');throws(()=>validateReceipt(c,[c]),'duplicate serial rejected');throws(()=>validateReceipt({...c,totalHours:1},[]),'invalid life totals rejected');throws(()=>validateReceipt({...c,cycles:1.5},[]),'fraction cycles rejected');
check(canQualityApprove(c),'quality eligible');throws(()=>canQualityApprove({...c,hours:1000}),'expired quality block');throws(()=>validateInstall(c,'Z-WRH','System B',[]),'quarantine install blocked');
const serviceable={...c,condition:'Serviceable',inspectedBy:'k.moyo'};check(validateInstall(serviceable,'Z-WRH','System B',[]),'inspected installation');throws(()=>validateInstall(serviceable,'Z-WRH','System A',STORE.components),'occupied position block');
const f=forecastComponent({...c,cycles:90,flights:90},4,2);check(f.days===5&&f.basis==='Cycles','cycle forecast');check(forecastComponent({...c,due:relativeDate(2)},4,2).basis==='Calendar','calendar controls');
check(flightAssessment('Z-WRH',2,1,demoDate).length===0,'no limit conflict');check(flightAssessment('Z-WRH',3000,1,demoDate).length>0,'hour exceedance');check(flightAssessment('Z-WPV',2,1,demoDate).includes('AOG')===false,'no seeded AOG in isolated test');
STORE.defects.push({reg:'Z-WRH',priority:'Grounded',status:'Open'});check(aircraftState(STORE.fleet[2])==='TECHNICAL HOLD','defect hold');check(flightAssessment('Z-WRH',2,1,demoDate).length>0,'open defect assessment');
`,ctx);console.log('PASS: receipt validation, quality gating, fitment occupancy, forecasts, flight limits and technical holds.');
