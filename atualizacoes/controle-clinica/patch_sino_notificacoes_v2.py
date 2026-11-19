import os
import re
from pathlib import Path

jsx_path=Path(os.environ['CUIDARE_CONTROLE_JSX'])
css_path=Path(os.environ['CUIDARE_CONTROLE_CSS'])
jsx=jsx_path.read_text(encoding='utf-8-sig').replace('\r\n','\n')
css=css_path.read_text(encoding='utf-8-sig').replace('\r\n','\n')
marker='CUIDARE_SINO_NOTIFICACOES_V2'
if marker in jsx:
    print('O sininho ja esta instalado; nenhum arquivo alterado.')
    raise SystemExit(0)

def mudar_unico(origem, regex, troca, nome, flags=0):
    achados=list(re.finditer(regex, origem, flags=flags))
    if len(achados)!=1:
        raise RuntimeError(f'{nome}: trecho encontrado {len(achados)} vezes. Nenhum arquivo foi alterado.')
    m=achados[0]
    conteudo=troca(m) if callable(troca) else troca
    return origem[:m.start()]+conteudo+origem[m.end():]

jsx=mudar_unico(jsx,
    r'(const\s*\[\s*aba\s*,\s*setAba\s*\]\s*=\s*useState\([^;]+;)',
    lambda m: m.group(1)+'\n  const [filtroNotificacao, setFiltroNotificacao] = useState("todas");',
    'estado das abas')

jsx=mudar_unico(jsx,
    r'(const\s+resumo\s*=\s*dados\.resumo\s*;)',
    lambda m: m.group(1)+'''
  // CUIDARE_SINO_NOTIFICACOES_V2
  const notificacoes = [...(resumo?.alertas || [])].sort((a,b) => {
    const prioridade = x => x.situacao === "vencido" ? 0 : 1;
    return prioridade(a)-prioridade(b) || String(a.vencimento || "").localeCompare(String(b.vencimento || ""));
  });
  const totalNotificacoes = notificacoes.length;
  const notificacoesFiltradas = filtroNotificacao === "todas"
    ? notificacoes
    : notificacoes.filter(n => n.tipo === filtroNotificacao);
''',
    'dados dos alertas')

novo_tab='''\n      <button type="button" className={aba === "notificacoes" ? "ativo" : ""} onClick={() => novaAba("notificacoes")}>Notificações{totalNotificacoes > 0 ? ` (${totalNotificacoes})` : ""}</button>\n'''
jsx=mudar_unico(jsx,
    r'<nav\b[^>]*className\s*=\s*["\'][^"\']*\bcc-abas\b[^"\']*["\'][^>]*>[\s\S]*?</nav>',
    lambda m: m.group(0).replace('</nav>', novo_tab+'    </nav>'),
    'barra de abas')

bell='''<button type="button" className="cc-sino-notificacoes" onClick={()=>novaAba("notificacoes")} aria-label={`Abrir central de notificações (${totalNotificacoes})`} title="Ver notificações">
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
  {totalNotificacoes > 0 && <span className="cc-sino-contador">{totalNotificacoes}</span>}
</button>'''
jsx=mudar_unico(jsx, r'(<h3>\s*Alertas e próximos vencimentos\s*</h3>)',
                lambda m: m.group(1)+bell, 'sino no cartao de visao geral')

bloco='''      {aba==="notificacoes"&&<>
        <section className="cc-cartao cc-central-notificacoes">
          <div className="cc-linha-titulo cc-notif-titulo"><h3>Notificações da clínica</h3><button type="button" disabled={salvando} onClick={()=>acao(async()=>{},"Notificações atualizadas.")}>Atualizar</button></div>
          <p className="cc-ajuda">Alvarás, documentos, domínios e manutenções vencidos ou próximos do vencimento. Os avisos são calculados a partir das datas e dos prazos cadastrados.</p>
          <div className="cc-notif-filtros" role="group" aria-label="Filtrar notificações">
            {[["todas","Todas"],["documento","Documentos"],["manutencao","Manutenções"]].map(([id,rotulo])=><button key={id} type="button" className={filtroNotificacao===id?"ativo":""} onClick={()=>setFiltroNotificacao(id)}>{rotulo}{id==="todas"?` (${totalNotificacoes})`:""}</button>)}
          </div>
          {notificacoesFiltradas.length ? <div className="cc-lista-alertas">
            {notificacoesFiltradas.map(a=><button type="button" key={`${a.tipo}-${a.id}`} className="cc-alerta-item" onClick={()=>novaAba(a.tipo==="documento"?"documentos":"equipamentos")}>
              <div><strong>{a.nome}</strong><small>{a.tipo==="documento"?"Documento":"Manutenção"} · {dataBR(a.vencimento)} · {a.situacao==="vencido"?"Atrasado":"Próximo do prazo"}</small></div><Selo situacao={a.situacao}/>
            </button>)}
          </div> : <p className="cc-notif-vazio">Nenhuma notificação para este filtro.</p>}
        </section>
      </>}
'''
jsx=mudar_unico(jsx, r'\{\s*aba\s*===\s*["\']documentos["\']\s*&&\s*<>',
                lambda m: bloco+'      '+m.group(0), 'insercao da central de notificacoes')

css += '''
/* CUIDARE_SINO_NOTIFICACOES_V2 */
.cc-pagina button.cc-sino-notificacoes{position:relative;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:7px;margin-left:auto;background:#f9f5e9;color:#0e4334;border:1px solid #d8c28d;border-radius:11px}
.cc-pagina button.cc-sino-notificacoes:hover{background:#f0e5cb}
.cc-sino-contador{position:absolute;top:-8px;right:-8px;display:flex;justify-content:center;align-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:14px;font-size:11px;font-weight:800;background:#b14c2c;color:#fff;border:2px solid white}
.cc-notif-filtros{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 18px}
.cc-pagina .cc-notif-filtros button.ativo{background:#0e4334;color:#fff;border-color:#0e4334}
.cc-notif-vazio{padding:20px 6px;color:#6b7d70;text-align:center}
@media(max-width:620px){.cc-notif-titulo{flex-wrap:wrap}.cc-pagina button.cc-sino-notificacoes{width:38px;height:38px}}
'''

# Verifica todos os pontos antes de gravar qualquer arquivo.
if jsx.count(marker)!=1:
    raise RuntimeError('Marcador inconsistente. Instalacao cancelada.')
jsx_path.write_bytes(jsx.encode('utf-8'))
css_path.write_bytes(css.encode('utf-8'))
print('Sininho, contador e aba Notificacoes incluidos.')
