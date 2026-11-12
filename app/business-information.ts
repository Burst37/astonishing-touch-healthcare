import {business,services,faqs,companyStory} from './content';
import {serviceDetails} from './service-details';
import {serviceAnswers} from './service-answers';
import {careQuestions} from './search-content';
import {careGuides} from './care-guides/content';
import {careKnowledge} from './care-knowledge';
export function lookupBusinessInformation(query:string){
 const origin='https://www.astonishingtouchhealthcare.org';
 const pages=[
  {title:'Company story, founder and mission',path:'/about',text:JSON.stringify({business,founder:'Brittany Wadley',founded:'2018',...companyStory})},
  {title:'Contact, directions, office hours and getting started',path:'/contact',text:JSON.stringify({business,faqs,website:careKnowledge.website})},
  ...services.map(s=>({title:s.title,path:'/services/'+s.id,text:JSON.stringify({...s,...serviceDetails[s.id],additionalQuestions:serviceAnswers[s.id]})})),
  {title:'Home-care questions and answers',path:'/care-questions',text:JSON.stringify(careQuestions)},
  ...careGuides.map(g=>({title:g.title,path:'/care-guides/'+g.slug,text:JSON.stringify(g)})),
  {title:'Privacy and how Ask Brittany works',path:'/privacy',text:JSON.stringify(careKnowledge.website)},
  {title:'General care concepts and unpublished agency policies',path:'/care-questions',text:JSON.stringify(careKnowledge.generalCare)},
 ];
 const tokens=query.toLowerCase().match(/[a-z0-9]+/g)?.filter(t=>t.length>2&&!['the','and','you','your','can','does','what','how','about','tell','with','for','our','are','have'].includes(t))||[];
 const expanded=[...new Set([...tokens,...(tokens.some(t=>['owner','founded','founder','history','story','mission','brittany'].includes(t))?['founder','mission','story']:[])])];
 const ranked=pages.map((p,index)=>({...p,index,score:expanded.reduce((score,token)=>score+(p.title.toLowerCase().includes(token)?10:0)+(p.text.toLowerCase().includes(token)?1:0),0)})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,4);
 return {reply:'Use the published information below. If the requested fact is not stated, explain that staff must confirm it. General care guidance is not a verified agency policy.',knowledge:ranked.map(({title,path,text})=>({title,url:origin+path,content:text})),sources:ranked.map(({title,path})=>({title,url:origin+path})),checkedAt:new Date().toISOString(),limits:'No live caregiver schedules, individual client records, prices, payment participation or unpublished policies are available. Do not infer them.'};
}
