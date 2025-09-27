/**
 * scripts/list-and-generate-endpoints.js
 *
 * Ejecutar desde la raíz del repo:
 *   node scripts/list-and-generate-endpoints.js
 *
 * Resultado:
 *   - api-endpoints.json    (lista en formato estructurado)
 *   - API_DOC.md            (tabla en Markdown)
 *   - welcome-generated.html (HTML simple con la tabla)
 *
 * Nota: cubre patterns comunes de Express:
 *   - app.use('/ruta', require('./routes/foo'))
 *   - const r = require('./routes/foo'); app.use('/ruta', r)
 *   - import r from './routes/foo'; app.use('/ruta', r)
 *   - router.get/post/put/delete/patch('/path', ...)
 *   - app.get/post/put/delete/patch('/path', ...)
 *
 * Si tenés rutas montadas con variables o generadas dinámicamente, el script
 * puede no resolverlas 100% — en ese caso pegá el resultado y lo ajustamos.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

function readFileSafe(p){
  try { return fs.readFileSync(p, 'utf8'); }
  catch(e){ return null; }
}

function walk(dir){
  const acc = [];
  const list = fs.readdirSync(dir);
  for(const name of list){
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if(st.isDirectory()){
      // evitar node_modules si existiera
      if(name === 'node_modules') continue;
      acc.push(...walk(full));
    } else if (name.endsWith('.js') || name.endsWith('.ts')) {
      acc.push(full);
    }
  }
  return acc;
}

function normalizeJoin(a,b){
  if(!a) return b || '/';
  if(!b) return a || '/';
  const join = ('/' + [a,b].map(x=>x.replace(/^\/+|\/+$/g,'')).filter(Boolean).join('/')).replace(/\/+/g,'/');
  return join;
}

function resolveModuleFile(fromFile, modulePath){
  if(!modulePath) return null;
  // if module is absolute (rare)
  if(modulePath.startsWith('/')) {
    const abs = path.resolve(ROOT, '.' + modulePath);
    return findExisting(abs);
  }
  // if module is node module (no resolver)
  if(!modulePath.startsWith('.')) {
    return null;
  }
  const base = path.dirname(fromFile);
  const abs = path.resolve(base, modulePath);
  return findExisting(abs);
}

function findExisting(base){
  const candidates = [ base, base + '.js', base + '.ts', path.join(base,'index.js'), path.join(base,'index.ts') ];
  for(const c of candidates) if(fs.existsSync(c)) return c;
  return null;
}

function extractAppMounts(filePath, content){
  const mounts = [];
  // pattern: app.use('/ruta', require('./routes/xx'))
  const reReq = /app\.use\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*require\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let m;
  while((m = reReq.exec(content)) !== null){
    mounts.push({file:filePath, mount: m[1], module: m[2]});
  }
  // pattern: app.use('/ruta', someVar)  -> find var require/import
  const reVar = /app\.use\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([A-Za-z0-9_$]+)\s*\)/g;
  while((m = reVar.exec(content)) !== null){
    const mount = m[1], varName = m[2];
    // find require or import assigning varName
    const reAssignReq = new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*require\\(\\s*['"\`]([^'"\`]+)['"\`]\\s*\\)`);
    const reImport = new RegExp(`import\\s+${varName}\\s+from\\s+['"\`]([^'"\`]+)['"\`]`);
    const rr = content.match(reAssignReq) || content.match(reImport);
    const modulePath = rr ? rr[1] : null;
    mounts.push({file:filePath, mount, module: modulePath});
  }

  // pattern: const foo = require('./routes/foo'); app.use('/x', foo);
  // already covered by the above.

  return mounts;
}

function extractRouterRoutes(filePath, content){
  const routes = [];
  if(!content) return routes;
  // router.METHOD('path'
  const reRouter = /(?:router|Router)\.(get|post|put|delete|patch|options)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while((m = reRouter.exec(content)) !== null){
    routes.push({method:m[1].toUpperCase(), path:m[2], file:filePath, type:'router'});
  }
  // router.route('/x').get(...)
  const reRouteChain = /(?:router|Router)\.route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\.([a-zA-Z]+)/g;
  while((m = reRouteChain.exec(content)) !== null){
    routes.push({method:m[2].toUpperCase(), path:m[1], file:filePath, type:'router'});
  }
  // app.METHOD('/x'...
  const reApp = /(?:app)\.(get|post|put|delete|patch|options)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  while((m = reApp.exec(content)) !== null){
    routes.push({method:m[1].toUpperCase(), path:m[2], file:filePath, type:'app'});
  }
  return routes;
}

function main(){
  console.log('➡️  Escaneando archivos JS/TS en', ROOT);
  const files = walk(ROOT);
  // leer contenidos
  const contents = {};
  for(const f of files) contents[f] = readFileSafe(f);

  // buscar archivos que parezcan contener "app"
  const appFiles = files.filter(f => {
    const c = contents[f] || '';
    return /\bexpress\(|\bconst\s+app\b|\bapp\./.test(c);
  });

  // colectar montajes app.use
  const mounts = [];
  for(const f of appFiles){
    const c = contents[f] || '';
    mounts.push(...extractAppMounts(f,c));
  }

  // resolver módulos y extraer rutas dentro de routers
  const results = [];

  for(const mt of mounts){
    const resolved = resolveModuleFile(mt.file, mt.module);
    if(resolved){
      const rc = contents[resolved] || readFileSafe(resolved);
      const rts = extractRouterRoutes(resolved, rc);
      if(rts.length===0){
        // tal vez el router se exporta desde otro archivo; aún así incluimos el mount
        results.push({method:'MOUNT', path: mt.mount, file: resolved, note: 'no se encontraron router.METHOD dentro del módulo (ver archivo)'});
      } else {
        for(const r of rts){
          const full = normalizeJoin(mt.mount, r.path);
          results.push({method: r.method, path: full, file: resolved});
        }
      }
    } else {
      results.push({method:'MOUNT', path: mt.mount, file: mt.module, note:'módulo no encontrado desde '+mt.file});
    }
  }

  // también extraer rutas definidas directamente en archivos app (app.get/...)
  for(const f of appFiles){
    const rts = extractRouterRoutes(f, contents[f]);
    for(const r of rts){
      if(r.type === 'app') results.push({method:r.method, path:r.path, file:f});
    }
  }

  // eliminar duplicados simples
  const uniq = [];
  const seen = new Set();
  for(const it of results){
    const key = `${it.method}::${it.path}::${it.file}`;
    if(!seen.has(key)){
      seen.add(key);
      uniq.push(it);
    }
  }

  // guardar archivos
  fs.writeFileSync(path.join(ROOT,'api-endpoints.json'), JSON.stringify(uniq, null, 2), 'utf8');

  // Generar Markdown
  let md = '# API - Endpoints detectados\\n\\n';
  md += '| Método | Ruta | Archivo | Nota |\\n';
  md += '|---|---|---|---|\\n';
  for(const e of uniq){
    md += `| ${e.method || ''} | \`${e.path}\` | ${path.relative(ROOT,e.file||'--')} | ${e.note || ''} |\\n`;
  }
  fs.writeFileSync(path.join(ROOT,'API_DOC.md'), md, 'utf8');

  // Generar HTML simple
  let html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>API Endpoints</title><style>body{font-family:Arial;padding:18px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}</style></head><body><h1>Endpoints detectados</h1><table><thead><tr><th>Método</th><th>Ruta</th><th>Archivo</th><th>Nota</th></tr></thead><tbody>`;
  for(const e of uniq){
    html += `<tr><td>${e.method||''}</td><td><code>${e.path}</code></td><td>${path.relative(ROOT,e.file||'--')}</td><td>${e.note||''}</td></tr>`;
  }
  html += `</tbody></table></body></html>`;
  fs.writeFileSync(path.join(ROOT,'welcome-generated.html'), html, 'utf8');

  console.log(`✅ Encontrados ${uniq.length} endpoints. Archivos generados: api-endpoints.json, API_DOC.md, welcome-generated.html`);
  console.log('Si querés que yo lo convierta en un README más bonito o el HTML exacto que querés, pegá API_DOC.md aquí y yo te lo dejo fino.');
}

main();
