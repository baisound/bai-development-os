import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve('templates/consumer-evidence/python');

function detectPython() {
  for (const candidate of [
    { command: process.env.BAI_TEST_PYTHON, args: [] },
    { command: 'python3', args: [] },
    { command: 'python', args: [] },
    { command: 'py', args: ['-3'] },
  ]) {
    if (!candidate.command) continue;
    const result = spawnSync(candidate.command, [...candidate.args, '--version'], { encoding: 'utf8' });
    if (result.status === 0) return candidate;
  }
  return null;
}

const python = detectPython();
function run(code) {
  if (!python) throw new Error('Python 3 interpreter unavailable');
  return spawnSync(python.command, [...python.args, '-c', code], {
    env: { ...process.env, PYTHONPATH: root, PYTHONDONTWRITEBYTECODE: '1' },
    encoding: 'utf8',
  });
}

test('Product-owned Python reference fails closed on ambiguous Event, catalog privacy, unsafe object key and policy version mismatch', { skip: !python }, () => {
  const result = run(`from bai_consumer_evidence.sanitizer import sanitize_event
from bai_consumer_evidence.artifact import object_key
from bai_consumer_evidence.policy import ClientPolicy,intersect_policy
checks=[]
base={'event_id':'evt-12345678','occurred_at':'2026-08-11T00:00:00Z','type':'feature_result','feature':'subtitle_import','result':'success','privacy_level':'P0','properties':{'cue_count':1}}
for fn in [lambda:sanitize_event({**base,'operation':'also'}),lambda:sanitize_event({**base,'privacy_level':'P2'}),lambda:object_key({'created_at':'2026-08-11T00:00:00Z','product':{'product_id':'../bad'},'installation':{'installation_id':'inst-12345678'},'batch_id':'batch-12345678'}),lambda:intersect_policy(ClientPolicy(event_catalog_version='1.0'),ClientPolicy(event_catalog_version='2.0'))]:
 try: fn(); checks.append(False)
 except ValueError: checks.append(True)
assert all(checks)
`);
  assert.equal(result.status, 0, result.stderr ?? result.error?.message);
});

test('Product-owned Python receipt validator binds batch and Event IDs before ack', { skip: !python }, () => {
  const result = run(`from bai_consumer_evidence.client import _acknowledged_event_ids
b={'batch_id':'batch-12345678','events':[{'event_id':'evt-12345678'}]}
good={'receipt_version':'1.0','batch_id':'batch-12345678','accepted':['evt-12345678'],'already_seen':[],'rejected':[]}
assert _acknowledged_event_ids(good,b)==['evt-12345678']
for bad in [{**good,'batch_id':'other-12345678'},{**good,'accepted':['evt-unknown-1234']},{**good,'already_seen':['evt-12345678']}]:
 try: _acknowledged_event_ids(bad,b); raise AssertionError('expected fail')
 except ValueError: pass
`);
  assert.equal(result.status, 0, result.stderr ?? result.error?.message);
});

test('Product-owned Python presigned Object Storage uploader is credential-free, redirect-safe and does not acknowledge Outbox Events', { skip: !python }, () => {
  const result = run(`import json,tempfile,threading
from http.server import BaseHTTPRequestHandler,HTTPServer
from bai_consumer_evidence import EvidenceClient,LocalOutbox
class Cred:
 def is_configured(self): return False
 def get_secret(self): return None
class H(BaseHTTPRequestHandler):
 body=b''; auth=None; digest=None; requests=0
 def do_PUT(self):
  H.requests+=1; H.auth=self.headers.get('Authorization');H.digest=self.headers.get('X-Content-SHA256');H.body=self.rfile.read(int(self.headers.get('Content-Length','0')));self.send_response(204);self.end_headers()
 def log_message(self,*a): pass
s=HTTPServer(('127.0.0.1',0),H);threading.Thread(target=s.serve_forever,daemon=True).start()
with tempfile.TemporaryDirectory() as d:
 out=LocalOutbox(d);c=EvidenceClient('http://unused','bai-video-production','0.17.0','inst-demo-12345678',Cred(),out)
 q=c.record_event('feature_result','subtitle_import','success',properties={'cue_count':2},event_id='evt-demo-12345678');assert q['status']=='queued'
 url=f'http://127.0.0.1:{s.server_port}/signed?opaque=1'
 x=c.flush_to_object_storage(lambda meta:{'url':url,'headers':{'X-Demo-Signed':'yes'}},allow_insecure_loopback=True)
 assert x['status']=='stored' and x['stored'] is True and x['event_ids']==['evt-demo-12345678']
 assert H.requests==1 and H.auth is None and H.digest==x['content_sha256']
 body=json.loads(H.body.decode());assert body['events'][0]['event_id']=='evt-demo-12345678' and body['content_sha256']==x['content_sha256']
 assert [e['event_id'] for e in out.list_events()]==['evt-demo-12345678']
s.shutdown();s.server_close()
`);
  assert.equal(result.status, 0, result.stderr ?? result.error?.message);
});

test('Product-owned Python presigned uploader rejects redirect, remote plaintext URL and credential-bearing headers', { skip: !python }, () => {
  const result = run(`import threading
from http.server import BaseHTTPRequestHandler,HTTPServer
from bai_consumer_evidence.artifact import build_artifact
from bai_consumer_evidence.object_storage import upload_artifact_presigned,validate_presigned_url
b={'schema_version':'1.0','batch_id':'batch-demo-12345678','created_at':'2026-08-11T00:00:00Z','product':{'product_id':'bai-video-production','product_version':'0.17.0'},'installation':{'installation_id':'inst-demo-12345678'},'events':[]}
a=build_artifact(b)
try: validate_presigned_url('http://example.com/x');raise AssertionError('expected HTTPS rejection')
except ValueError: pass
class R(BaseHTTPRequestHandler):
 def do_PUT(self): self.send_response(307);self.send_header('Location',f'http://127.0.0.1:{self.server.server_port}/other');self.end_headers()
 def log_message(self,*a): pass
s=HTTPServer(('127.0.0.1',0),R);threading.Thread(target=s.serve_forever,daemon=True).start();u=f'http://127.0.0.1:{s.server_port}/signed'
r=upload_artifact_presigned(u,a,allow_insecure_loopback=True);assert r['status']=='http_307' and r['stored'] is False
r=upload_artifact_presigned(u,a,headers={'Authorization':'Bearer must-not-be-sent'},allow_insecure_loopback=True);assert r['status']=='delivery_unavailable' and r['stored'] is False
s.shutdown();s.server_close()
`);
  assert.equal(result.status, 0, result.stderr ?? result.error?.message);
});
