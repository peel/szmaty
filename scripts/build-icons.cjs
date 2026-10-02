// Requires sharp. Keep all platform icons derived from the same editable SVG.
const path=require('node:path');
const sharp=require('sharp');
const root=path.resolve(__dirname,'../icons');
(async()=>{
 for(const size of [32,180,192,512])await sharp(path.join(root,'icon.svg')).resize(size,size).png().toFile(path.join(root,`icon-${size}.png`));
 await sharp(path.join(root,'icon.svg')).resize(512,512).png().toFile(path.join(root,'icon-maskable-512.png'));
})().catch(e=>{console.error(e);process.exit(1)});
