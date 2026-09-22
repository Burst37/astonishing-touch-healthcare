import {organization} from './search-structure';
import Experience from './experience';
import {business, services, faqs} from './content';
export const metadata={alternates:{canonical:'https://www.astonishingtouchhealthcare.org/'}};
export default function Home(){
 const schema = {'@context':'https://schema.org','@graph':[organization,{'@type':'WebSite','@id':'https://www.astonishingtouchhealthcare.org/#website',url:'https://www.astonishingtouchhealthcare.org/',name:'Astonishing Touch',publisher:{'@id':'https://www.astonishingtouchhealthcare.org/#organization'},inLanguage:'en-US'},{'@type':'FAQPage',mainEntity:faqs.map(f=>({'@type':'Question',name:f.q,acceptedAnswer:{'@type':'Answer',text:f.a}}))}]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/><Experience/></>;
}
