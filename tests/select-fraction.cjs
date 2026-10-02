module.exports=async function selectFraction(page,fraction){
 const desired=page.locator(`[data-fraction="${fraction}"]`);
 if(await desired.getAttribute('aria-pressed')!=='true')await desired.evaluate(e=>e.click());
 for(const other of ['textiles','electronics'].filter(id=>id!==fraction)){
  const button=page.locator(`[data-fraction="${other}"]`);
  if(await button.getAttribute('aria-pressed')==='true')await button.evaluate(e=>e.click());
 }
};
