import type {MetadataRoute} from 'next';
import {absolute,searchConfig} from './search-config';
export default function robots():MetadataRoute.Robots{return searchConfig.publicIndexing?{rules:{userAgent:'*',allow:'/',disallow:['/api/','/inquiries']},sitemap:absolute('/sitemap.xml')}:{rules:{userAgent:'*',disallow:'/'}}}
