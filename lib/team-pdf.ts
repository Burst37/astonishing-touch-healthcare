import {jsPDF} from 'jspdf';
import {autoTable} from 'jspdf-autotable';
import {visitHours,locationLabels} from './team';
import type {TeamReport} from './team-reports';
const stamp=(v:string|null|undefined)=>v?new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(v)):'Open';
const text=(v:unknown)=>String(v??'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"');
export function buildTeamPdf(report:TeamReport,font:string){
 const doc=new jsPDF({orientation:'landscape',unit:'pt',format:'letter',compress:true,putOnlyUsedFonts:true});
 doc.addFileToVFS('Report.ttf',font);doc.addFont('Report.ttf','Report','normal');doc.addFont('Report.ttf','Report','bold');
 const schedule=report.filters.kind==='schedule',title=schedule?'Work schedule':'Clock-in / clock-out report';
 const staff=(id:string)=>text(report.staff.find(s=>s.id===id)?.name||id),client=(id:string)=>text(report.clients.find(c=>c.id===id)?.name||id);
 const employee=report.filters.employee?staff(report.filters.employee):'All employees';
 doc.setProperties({title:`Astonishing Touch - ${title}`,author:'Astonishing Touch',subject:'Confidential care-team report'});
 doc.setFillColor(24,54,75);doc.rect(0,0,792,89,'F');doc.setTextColor(255);doc.setFont('Report','bold');doc.setFontSize(19);doc.text('ASTONISHING TOUCH',32,32);doc.setFontSize(13);doc.text(title,32,56);doc.setFont('Report','normal');doc.setFontSize(9);doc.text(text(`${report.filters.from} through ${report.filters.to} | ${employee}`),32,75,{maxWidth:728});
 doc.setTextColor(45,66,80);doc.setFontSize(9);
 const completed=report.visits.filter(v=>v.clock_out),hours=completed.reduce((n,v)=>n+visitHours(v),0),scheduled=report.schedule.filter(s=>s.status==='scheduled');
 const planned=scheduled.reduce((n,s)=>n+(Date.parse(s.ends_at)-Date.parse(s.starts_at))/3600000,0);
 const summary=schedule?`${report.schedule.length} visits | ${planned.toFixed(2)} scheduled hours | ${report.schedule.length-scheduled.length} cancelled`:`${report.visits.length} visits | ${completed.length} completed | ${report.visits.length-completed.length} open | ${hours.toFixed(2)} completed hours`;
 doc.text(text(summary),32,108);doc.text(text(`Generated ${stamp(report.generatedAt)}${report.demo?' | DEMO - FICTIONAL RECORDS':''}`),32,123);
 const notes=schedule?'Visits are selected by their start date in Central Time. Cancelled visits are excluded from scheduled-hour totals.':'Visits are selected by clock-in date in Central Time; a full overnight visit belongs to its start date. Open visits are excluded from hour totals. Hours use current corrected timestamps, without payroll rounding. Location readings do not prove continuous presence.';
 const lines=doc.splitTextToSize(notes,728);doc.text(lines,32,141);const y=145+lines.length*11;
 const opts={margin:{left:32,right:32,top:32,bottom:36},styles:{font:'Report',fontSize:8,cellPadding:7,overflow:'linebreak' as const},headStyles:{fillColor:[35,89,107] as [number,number,number],fontStyle:'bold' as const},alternateRowStyles:{fillColor:[241,246,248] as [number,number,number]},rowPageBreak:'avoid' as const};
 if(schedule)autoTable(doc,{...opts,startY:y,head:[['Employee / Client','Date & time (Central)','Location','Hours','Status']],body:[...report.schedule].sort((a,b)=>a.starts_at.localeCompare(b.starts_at)).map(s=>[staff(s.employee_id)+'\n'+client(s.client_id),stamp(s.starts_at)+'\nto '+stamp(s.ends_at),text(report.clients.find(c=>c.id===s.client_id)?.address||'Address unavailable'),((Date.parse(s.ends_at)-Date.parse(s.starts_at))/3600000).toFixed(2),s.status]),columnStyles:{0:{cellWidth:160},1:{cellWidth:170},2:{cellWidth:228},3:{cellWidth:60},4:{cellWidth:110}}});
 else autoTable(doc,{...opts,startY:y,head:[['Employee / Client','Clock in / out (Central)','Hours','Location readings','Review / reason']],body:[...report.visits].sort((a,b)=>a.clock_in.localeCompare(b.clock_in)).map(v=>[staff(v.employee_id)+'\n'+client(v.client_id),stamp(v.clock_in)+'\n'+stamp(v.clock_out),v.clock_out?visitHours(v).toFixed(2):'Open',text('In: '+locationLabels[v.in_status]+'\nOut: '+(v.out_status?locationLabels[v.out_status]:'Open')),text(v.review_status.replaceAll('_',' ')+(v.review_reason?'\n'+v.review_reason:''))]),columnStyles:{0:{cellWidth:145},1:{cellWidth:165},2:{cellWidth:48},3:{cellWidth:170},4:{cellWidth:200}}});
 if(!(schedule?report.schedule.length:report.visits.length)){doc.setFontSize(11);doc.text('No records match this period and employee.',32,y+42)}
 const totals=new Map<string,number>();for(const v of completed)totals.set(v.employee_id,(totals.get(v.employee_id)||0)+visitHours(v));for(const s of scheduled)if(schedule)totals.set(s.employee_id,(totals.get(s.employee_id)||0)+(Date.parse(s.ends_at)-Date.parse(s.starts_at))/3600000);
 if(totals.size){doc.addPage();doc.setFont('Report','bold');doc.setFontSize(15);doc.text(schedule?'Scheduled hours by employee':'Completed hours by employee',32,42);autoTable(doc,{...opts,startY:58,head:[['Employee','Hours']],body:[...totals].map(([id,h])=>[staff(id),h.toFixed(2)])})}
 if(report.corrections.length){doc.addPage();doc.setFont('Report','bold');doc.setFontSize(15);doc.text('Manager time corrections',32,42);autoTable(doc,{...opts,startY:58,head:[['Employee / Client / Visit','Changed by / When','Before','After','Reason']],body:report.corrections.map(a=>{const v=report.visits.find(v=>v.id===a.visit_id);return[v?staff(v.employee_id)+'\n'+client(v.client_id)+'\n'+a.visit_id:a.visit_id,staff(a.actor_id)+'\n'+stamp(a.created_at),stamp(a.before_state?.clock_in)+'\n'+stamp(a.before_state?.clock_out),stamp(a.after_state?.clock_in)+'\n'+stamp(a.after_state?.clock_out),text(a.reason)]})})}
 for(let i=1;i<=doc.getNumberOfPages();i++){doc.setPage(i);doc.setFont('Report','normal');doc.setFontSize(8);doc.setTextColor(80,99,111);doc.text(`Confidential - Management use${report.demo?' - DEMO':''}`,32,592);doc.text(`Page ${i} of ${doc.getNumberOfPages()}`,760,592,{align:'right'})}
 return doc;
}
