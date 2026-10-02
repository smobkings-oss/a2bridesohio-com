import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest{
  return{
    name:'A2B RIDES',
    short_name:'A2B RIDES',
    description:'Book and manage professional A2B RIDES transportation.',
    start_url:'/ride',
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
      {name:'Hop on now',short_name:'Hop',url:'/ride'},
      {name:'Schedule a ride',short_name:'Schedule',url:'/ride?mode=scheduled'},
      {name:'My rides',short_name:'Trips',url:'/ride?tab=trips'},
    ],
  };
}
