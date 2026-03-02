#!/bin/bash
cd /opt/chatbot
docker compose exec -T backend node -e "
const { getPrices } = require('./dist/services/adminService.js');
getPrices('56fac99c-f4d2-4694-b50b-79b2d58bc2cc').then(rows => {
  const demo = rows.filter(r => r.category === 'Демонтажные работы');
  const subs = [...new Set(demo.map(r => r.subcategory))];
  console.log('Tenant API result:');
  console.log('  Total demo:', demo.length);
  console.log('  Subcategories:', JSON.stringify(subs));
  demo.slice(0,3).forEach(r => console.log('  ', JSON.stringify({name: r.name, sub: r.subcategory})));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"
