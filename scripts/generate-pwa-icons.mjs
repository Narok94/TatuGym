import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const svg=await readFile(new URL('../public/forja-f.svg',import.meta.url),'utf8');
const browser=await chromium.launch();
try {
  for(const [file,size] of [['forja-f-192.png',192],['forja-f-512.png',512],['forja-f-maskable.png',512],['forja-f-apple.png',180]]) {
    const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
    await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${svg}`);
    await page.screenshot({path:new URL('../public/'+file,import.meta.url).pathname.replace(/^\/(\w:)/,'$1')});
    await page.close();
  }
}finally{await browser.close()}
