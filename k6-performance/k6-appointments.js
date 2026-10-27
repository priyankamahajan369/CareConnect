import http from 'k6/http';import {check,sleep} from 'k6';
export const options={vus:5,duration:'30s',thresholds:{http_req_failed:['rate<0.01'],http_req_duration:['p(95)<800']}};
export function setup(){if(!__ENV.ACCESS_TOKEN)throw new Error('Supply a valid staff ACCESS_TOKEN');}
export default function(){const r=http.get((__ENV.BASE_URL||'http://localhost:8080')+'/api/v1/appointments?size=20',{headers:{Authorization:'Bearer '+__ENV.ACCESS_TOKEN}});check(r,{'status 200':r=>r.status===200});sleep(1);}
