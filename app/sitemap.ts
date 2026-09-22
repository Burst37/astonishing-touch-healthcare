import type {MetadataRoute} from 'next';
import {services} from './content';
import {absolute} from './search-config';
export default function sitemap():MetadataRoute.Sitemap{return ['','/services','/about','/contact','/privacy',...services.map(s=>'/services/'+s.id)].map(path=>({url:absolute(path||'/'),changeFrequency:'monthly' as const,priority:path===''?1:.7}))}
