import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context=vm.createContext({window:{},URL});
for(const file of ['assets/fonts.js','renderer.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets/editor',file),'utf8'),context,{filename:file});
const F=context.window.Folio;
const required={bio:['name','english','role','headline','description','location','image','imageCaption'],projects:['title','intro','layout','items'],gallery:['title','intro','layout','items'],text:['title','intro','body'],timeline:['title','intro','items'],video:['title','intro','description','url','image'],contact:['title','description','email','wechat','url','linkLabel']};
const itemFields={projects:['title','category','year','role','description','image','url'],gallery:['caption','image'],timeline:['period','title','description']};
function ensure(test,message){if(!test)throw Error(message);}
function validate(s){
  ensure(s&&s.version===1&&Array.isArray(s.blocks)&&s.blocks.length<=30,'需要 version:1、blocks 数组，最多30个组件');
  for(const [key,values] of Object.entries({theme:Object.keys(F.themes),font:['serif','sans'],spacing:['compact','normal','airy'],motion:['none','fade','rise']}))ensure(values.includes(s[key]),`不支持的 ${key}`);
  ensure(typeof s.sample==='boolean','sample 必须为 true 或 false，真实资料应移除示例经历后设置为 false');
  ensure(/^#[0-9a-f]{6}$/i.test(s.accent),'accent 必须是 #RRGGBB');
  const ids=new Set();
  for(const [i,b] of s.blocks.entries()){
    ensure(b&&Object.hasOwn(required,b.type)&&b.data&&typeof b.data==='object',`blocks[${i}] 组件类型或数据错误`);
    ensure(typeof b.id==='string'&&/^[a-z][a-z0-9_-]{0,70}$/i.test(b.id)&&!ids.has(b.id),`blocks[${i}].id 不合规或重复`);ids.add(b.id);
    ensure(typeof b.label==='string'&&typeof b.visible==='boolean',`blocks[${i}] 需要 label 和 visible`);
    for(const key of required[b.type]){
      if(key==='items'){
        ensure(Array.isArray(b.data.items)&&b.data.items.length<=12,`blocks[${i}].data.items 最多12项`);
        for(const [j,item] of b.data.items.entries()){
          ensure(item&&typeof item==='object',`blocks[${i}].items[${j}] 格式不正确`);
          for(const field of itemFields[b.type])ensure(typeof item[field]==='string',`blocks[${i}].items[${j}].${field} 需要字符串`);
          if('image' in item){ensure(!item.image||F.image(item.image),'图片须为支持格式的 data URL');item.imageView=F.imageView(item.imageView);}
        }
      }else ensure(typeof b.data[key]==='string',`blocks[${i}].data.${key} 需要字符串`);
    }
    if('layout' in b.data)ensure(['grid','single'].includes(b.data.layout),'layout 只支持 grid 或 single');
    if('image' in b.data){ensure(!b.data.image||F.image(b.data.image),'图片须为支持格式的 data URL');b.data.imageView=F.imageView(b.data.imageView);}
  }
  return s;
}
try{
  ensure(process.argv[2],'请提供 profile.json 的路径');
  const state=validate(JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,'')));
  process.stdout.write(F.render(state,false));
}catch(error){process.stderr.write('无法生成网站：'+error.message+'\n');process.exitCode=1;}
