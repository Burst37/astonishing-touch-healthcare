import type { Metadata } from 'next';
import './globals.css';
import {searchConfig} from './search-config';
export const metadata: Metadata = {
 metadataBase:new URL('https://www.astonishingtouchhealthcare.org/'),
 title:'Home Care in Creve Coeur | Astonishing Touch',
 description:'Personalized in-home care, companionship and everyday support from Astonishing Touch in Creve Coeur, Missouri. Talk with our care team.',
 robots:{index:searchConfig.publicIndexing,follow:searchConfig.publicIndexing},
 openGraph:{title:'Astonishing Touch — Care that feels like home',description:'A more personal kind of in-home care in Creve Coeur, Missouri.',type:'website',locale:'en_US',siteName:'Astonishing Touch',images:[{url:'/images/care-that-feels-like-home.webp',width:1536,height:864,alt:'Astonishing Touch care at home'}]},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
