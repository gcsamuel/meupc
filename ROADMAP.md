# 🗺️ ROADMAP — Meu PC (Lista de Compras)

> Lista de tarefas organizada em **sprints**, para acompanhar o que já foi feito e o que falta.
> Marque com `[x]` as tarefas que forem concluídas.

---

## ✅ Sprint 1 — Base do projeto (concluída)

- [x] Ler e exibir os dados da planilha `tabeladecompras.xlsx`
- [x] Mostrar as 6 peças originais (Processador, Placa Mãe, Cooler, Fonte, Memória, Gabinete)
- [x] Calcular e exibir o valor total da lista (R$ 792,32)
- [x] Criar API REST com Flask
- [x] Criar interface visual com HTML, CSS e JavaScript

## ✅ Sprint 2 — Interação (concluída)

- [x] Adicionar nova peça
- [x] Editar peça existente
- [x] Apagar peça (com confirmação)
- [x] Salvar as alterações de volta na planilha `.xlsx`
- [x] Busca/filtro de peças na tabela
- [x] Link "Buscar ↗" que abre a loja (Shopee, Mercado Livre, Amazon ou link direto)
- [x] Resumo com quantidade de peças e total

### 💡 Evoluções de qualidade (feitas junto com o Sprint 4)

- [x] Validar valor negativo ou zero ao cadastrar
- [x] Percentual de conclusão (barra de progresso do orçamento)
- [x] Ordenar por preço, categoria ou nome ao clicar no cabeçalho

## ✅ Sprint 3 — Experiência do usuário (concluída)

- [x] Tema claro/escuro (toggle)
- [x] Salvar também em `JSON`/`CSV` como backup
- [x] Importar/exportar planilha pela interface
- [x] Histórico de preços (preço antigo x novo)
- [x] Notas/página pessoal por peça (ex.: "ainda falta alugar o frete")

## ✅ Sprint 4 — Comparação de preços automática (concluída)

- [x] **Busca e comparador de preços automático** (botão 🔎 Comparar em cada peça)
- [x] Fontes: Mercado Livre (API), Shopee (API) e busca geral (links reais das lojas)
- [x] Pedir o **CEP** para estimar o frete (salvo nas configurações ⚙️)
- [x] **Preencher o link automaticamente** quando a pessoa não informar (botão 🔎 no cadastro/edição)
- [x] Lista com o melhor preço destacado 🏆 e opção "Usar este link"
- [x] Mensagens claras quando alguma loja bloquear a busca

> ⚠️ Observação: Mercado Livre/Shopee podem bloquear buscas automáticas em alguns momentos/redes.
> Nesse caso o app avisa e mostra links das lojas pela busca geral.

## ✅ Sprint 5 — Dashboard moderno + APIs oficiais (concluída)

- [x] Redesign completo: **dashboard moderno com imagens** (fonte Inter, hero com gradiente, cards de estatísticas)
- [x] Visual em **cards (grade) com foto do produto** e alternância grade/lista
- [x] **Imagem por peça** salva na planilha (coluna Imagem) e vindas dos resultados de busca
- [x] **API oficial do Mercado Livre** com OAuth (token salvo em `config.json`; rota de autorização `/api/ml/auth`)
- [x] Credenciais por arquivo **`.env`** (criado `.env.example`; `.env` e `config.json` ignorados pelo Git)
- [x] Fallback: rota pública do ML + Shopee + busca geral quando a API não está conectada
- [x] Indicadores de status da API no comparador (pills ML/Shopee) e nas configurações

> 📄 Para conectar a API oficial: veja `GUIA-GITHUB.md` e o arquivo `.env.example` (Client ID/Secret do Mercado Livre Dev).

## ✅ Sprint 6 — Publicação no GitHub (concluída)

- [x] Inicializar o repositório (`git init`)
- [x] Criar arquivo `.gitignore` (segredos, `config.json` e planilha pessoal ignorados)
- [x] Escrever o `README.md`
- [x] Ver documentação/guia para envio no GitHub (ver `GUIA-GITHUB.md`)
- [x] Criar a primeira release/tag (ex.: `v1.0.0`)

> 🔗 Repositório: **https://github.com/gcsamuel/meupc** (público) · Branch `main` · Release `v1.0.0`

## 🟣 Sprint 7 — Futuro (ideias)

- [ ] Notificação de queda de preço (monitorar e avisar quando o preço baixar)
- [ ] Melhorar API de frete (cálculo por transportadora com CEP)
- [ ] Integração oficial da Shopee Open API (acesso de parceiro)
- [ ] Deploy em servidor gratuito (Render/Railway) + banco de dados

---

**Como usar:** edite este arquivo e troque `- [ ]` por `- [x]` quando terminar uma tarefa.