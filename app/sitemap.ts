import type {MetadataRoute} from 'next';
import {careGuides} from './care-guides/content';
import {services} from './content';
import {absolute} from './search-config';
export default function sitemap():MetadataRoute.Sitemap{return ['','/services','/about','/care-questions','/care-guides',...careGuides.map(g=>'/care-guides/'+g.slug),'/contact','/privacy',...services.map(s=>'/services/'+s.id)].map(path=>({url:absolute(path||'/'),changeFrequency:'monthly' as const,priority:path===''?1:.7}))}
