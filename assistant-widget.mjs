const panel=document.getElementById('assistant-panel');
const frame=document.getElementById('assistant-frame');
let opener;
for(const button of document.querySelectorAll('[data-open-assistant]'))button.addEventListener('click',()=>{
 opener=button;
 if(!frame.getAttribute('src'))frame.src='assistant.html?embedded=1';
 if(!panel.open)panel.showModal();
 for(const trigger of document.querySelectorAll('[data-open-assistant]'))trigger.setAttribute('aria-expanded','true');
});
document.getElementById('assistant-close').addEventListener('click',()=>panel.close());
panel.addEventListener('click',event=>{if(event.target===panel){const bounds=panel.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)panel.close();}});
panel.addEventListener('close',()=>{for(const trigger of document.querySelectorAll('[data-open-assistant]'))trigger.setAttribute('aria-expanded','false');opener?.focus();});
