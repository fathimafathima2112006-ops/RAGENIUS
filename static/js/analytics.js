(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  fetch('/api/analytics').then(r=>r.json()).then(data=>{
    if(!data.success)return;
    const labels=data.labels||[], lat=data.latency||[], conf=data.confidence||[];
    if(window.Chart){
      new Chart(document.getElementById('latencyChart'),{type:'line',data:{labels,datasets:[{label:'Total response ms',data:lat,tension:.35,fill:true}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
      new Chart(document.getElementById('confidenceChart'),{type:'line',data:{labels,datasets:[{label:'Confidence %',data:conf,tension:.35,fill:true}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{min:0,max:100}}}});
    }
    if(data.token_usage){ document.getElementById('inputTokens').textContent=data.token_usage.input.toLocaleString(); document.getElementById('outputTokens').textContent=data.token_usage.output.toLocaleString(); document.getElementById('estimatedCost').textContent='$'+Number(data.token_usage.estimated_cost_usd||0).toFixed(4); document.getElementById('totalLatency').textContent=lat.length?(lat.reduce((a,b)=>a+b,0)/lat.length).toFixed(1)+' ms':'—'; }
    if(data.evaluation){ document.getElementById('faithfulnessMetric').textContent=data.evaluation.faithfulness+'%'; document.getElementById('relevancyMetric').textContent=data.evaluation.answer_relevancy+'%'; document.getElementById('precisionMetric').textContent=data.evaluation.context_precision+'%'; document.getElementById('recallMetric').textContent=data.evaluation.context_recall+'%'; }
    const body=document.getElementById('analyticsEvents');
    body.innerHTML=(data.events||[]).map(e=>`<tr><td>${esc(e.query)}</td><td>${e.retrieval_ms} ms</td><td>${e.llm_ms} ms</td><td>${e.confidence}%</td><td>${e.sources}</td><td>${esc(e.created_at)}</td></tr>`).join('') || '<tr><td colspan="6">No retrieval events yet.</td></tr>';
  }).catch(()=>{});
})();
