import type { Metadata, Viewport } from 'next';
import './globals.css';
import {searchConfig} from './search-config';
// Let Android shrink the chat viewport when the on-screen keyboard opens.
export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',interactiveWidget:'resizes-content'};
export const metadata: Metadata = {
 metadataBase:new URL('https://www.astonishingtouchhealthcare.org/'),
 title:'Nonmedical Home Care in Creve Coeur, MO | Astonishing Touch',
 description:'Companion care, personal care and respite with Astonishing Touch in Creve Coeur, MO. Locally owned since 2018. Call to discuss a personalized home-care plan.',
 robots:{index:searchConfig.publicIndexing,follow:searchConfig.publicIndexing},
 openGraph:{title:'Astonishing Touch — Care that feels like home',description:'A more personal kind of in-home care in Creve Coeur, Missouri.',type:'website',locale:'en_US',siteName:'Astonishing Touch',images:[{url:'/images/care-that-feels-like-home.webp',width:1536,height:864,alt:'Astonishing Touch care at home'}]},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
