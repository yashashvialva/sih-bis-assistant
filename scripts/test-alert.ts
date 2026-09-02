import fetch from 'node-fetch';

async function main() {
  const url = 'http://localhost:3000/api/alerts/generate';
  const payload = {
    standardNumber: 'IS 8148 : 2018',
    title: 'Amendment No. 1 — Updated Cooling Capacity & IoT Requirements',
    categories: ['Air Conditioner'],
    oldText: 'c) Single refrigeration system having nominal cooling capacity 3 500 W and above with one evaporator and one condenser, controlled by a single thermostat/controller;',
    newText: 'c) Single refrigeration system having nominal cooling capacity 2 000 W and above (decreased from 3500 W) with one evaporator and one condenser. \n\n*NEW MANDATE*: All systems manufactured after Q4 must include mandatory IoT temperature logging capabilities for real-time compliance tracking.'
  };

  console.log('Sending request to LLM Diff Engine...');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
