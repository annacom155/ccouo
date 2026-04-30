const http=require('http'),https=require('https')
http.createServer((r,s)=>{
  let p=r.url.slice(1)
  if(p){
    https.get(`https://raw.githubusercontent.com/annacom155/ccouo/main/${p}`,g=>{
      g.pipe(s)
    }).on('error',e=>s.end('Error'))
  }else s.end('Need file path')
}).listen(3000)
