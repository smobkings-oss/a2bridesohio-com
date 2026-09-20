import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest{
  return{
    name:'A2B RIDES',
    short_name:'A2B RIDES',
    description:'Book and manage professional A2B RIDES transportation.',
    start_url:'/',
    scope:'/',
    display:'standalone',
    background_color:'#050505',
    theme_color:'#d4af37',
    orientation:'portrait',
    categories:['travel','transportation','business'],
    icons:[
      {src:'/icon',sizes:'512x512',type:'image/png',purpose:'maskable'},
      {src:'/apple-icon',sizes:'180x180',type:'image/png',purpose:'any'},
    ],
    shortcuts:[
      {name:'Book a Ride',short_name:'Book',url:'/book'},
      {name:'Passenger Dashboard',short_name:'My Rides',url:'/passenger'},
      {name:'Driver Dashboard',short_name:'Drive',url:'/driver'},
    ],
  };
}
