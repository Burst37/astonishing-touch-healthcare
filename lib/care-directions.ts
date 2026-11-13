import {business,directionsUrl,appleDirectionsUrl} from '@/app/content';
export function careDirections(message:string){
 const match=message.match(/(?:directions?|navigate|navigation|driv(?:e|ing)|how (?:do|can) (?:i|we) get)(?:\s+(?:me|us))?\s+to\s+(.+)/i);
 let destination=match?.[1]?.replace(/\s+from\s+.+$/i,'').replace(/[?.!]+$/,'').trim().slice(0,240)||'';
 const office=!destination||/^(?:you|your (?:office|business|location)|the office|astonishing touch)(?:\s|$)/i.test(destination);
 if(office)return{reply:'Our office is at '+business.address+', '+business.city+'. Choose Google Maps or Apple Maps below for a route. Office hours are Monday through Friday, 9 a.m. to 5 p.m. Please call ahead to arrange your visit.',mode:'guide',directionsUrl,appleDirectionsUrl};
 // Do not invent turn-by-turn instructions or transmit a starting address.
 destination=destination.replace(/[\r\n]/g,' ');
 return{reply:'Choose Google Maps or Apple Maps below for a route to '+destination+'. Your chosen maps app will ask for your starting point and show the available route. I haven’t started navigation or placed a call.',mode:'guide',directionsUrl:'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(destination),appleDirectionsUrl:'https://maps.apple.com/directions?mode=driving&destination='+encodeURIComponent(destination)};
}
