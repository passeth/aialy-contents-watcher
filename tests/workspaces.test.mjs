import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createWorkspaceApp } from '../server/workspaces.mjs';
import { createStore } from '../server/store.mjs';

test('workspaces preserve legacy data, isolate mutations and connections, and survive restart', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aialy-workspaces-'));
  const legacy = createStore(join(dir, 'instagram.sqlite'));
  legacy.addSource({username:'fraijour_fixture',label:'Existing',kind:'owned',intervalHours:6});
  legacy.db.close();
  let manager, server, base;
  async function start() {
    manager = createWorkspaceApp(dir);
    server = manager.app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}/api`;
  }
  async function stop() { await new Promise(resolve => server.close(resolve)); manager.close(); }
  async function request(path, {id='default',method='GET',body,origin}={}) {
    const response = await fetch(base + path, {method,headers:{'Content-Type':'application/json','X-Workspace-Id':id,...(origin?{Origin:origin}:{})},body:body?JSON.stringify(body):undefined});
    return {status:response.status,data:await response.json()};
  }
  try {
    await start();
    assert.equal((await request('/workspace')).data.sources[0].username, 'fraijour_fixture');
    const skin = (await request('/workspaces',{method:'POST',body:{name:'스킨케어'}})).data;
    const hair = (await request('/workspaces',{method:'POST',body:{name:'헤어케어'}})).data;
    assert.equal((await request('/workspace',{id:skin.id})).data.content.length,0);
    assert.equal((await request('/workspace',{id:skin.id})).data.connection.connected,false);
    const board = (await request('/boards',{id:skin.id,method:'POST',body:{name:'장벽 회복'}})).data;
    await request(`/boards/${board.id}`,{id:hair.id,method:'DELETE',body:{}});
    assert.equal((await request('/workspace',{id:skin.id})).data.boards[0].name,'장벽 회복');
    assert.equal((await request('/workspace',{id:hair.id})).data.boards.length,0);
    assert.equal((await request('/workspace')).data.boards.length,0);
    assert.equal((await request('/workspaces',{method:'POST',body:{name:' 스킨케어 '}})).status,409);
    assert.equal((await request('/workspace',{id:'../../outside'})).status,404);
    assert.equal((await request('/workspace',{id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'})).status,404);
    assert.equal((await request('/workspaces',{method:'POST',body:{name:'injected'},origin:'https://evil.example'})).status,403);
    assert.equal((await request('/workspaces',{method:'POST',body:{name:'   '}})).status,400);
    await stop();
    await start();
    assert.equal((await request('/workspaces')).data.length,3);
    assert.equal((await request('/workspace',{id:skin.id})).data.boards[0].name,'장벽 회복');
    assert.equal((await request('/workspace')).data.sources.length,1);
  } finally { if(server?.listening) await stop(); rmSync(dir,{recursive:true,force:true}); }
});
