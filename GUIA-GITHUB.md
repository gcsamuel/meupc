# 📤 GUIA-GITHUB — Passo a passo de publicação

> **Documentação é sua!** Este guia mostra **os comandos** para você colocar este projeto
> no GitHub pelo terminal. Você escolhe o conteúdo (README, textos, imagens).

---

## 0. Pré-requisitos

- [ ] Git instalado: verifique com `git --version`
- [ ] Conta criada no [github.com](https://github.com)
- [ ] Autenticação do Git na sua máquina:
  1. **Opção A (HTTPS):** token criado em *GitHub → Settings → Developer settings → Tokens*
  2. **Opção B (SSH):** chave cadastrada em *GitHub → Settings → SSH keys*

Teste a conexão com a opção SSH:
```bash
ssh -T git@github.com
# Esperado: "Hi seu-usuario! You've successfully authenticated..."
```

---

## 1. Entrar na pasta do projeto

```bash
cd ~/Documents/PROJETOS/MeuPc/meupc-app
```

---

## 2. Inicializar o repositório local

```bash
# Se ainda não tem um repositório aqui:
git init -b main

# Veja os arquivos que o Git está acompanhando:
git status
```

---

## 3. Conferir o arquivo .gitignore

O arquivo `meupc-app/.gitignore` já existe e evita enviar coisas desnecessárias
(`__pycache__/`, `*.pyc`, logs, etc.).
Importante: **`tabeladecompras.xlsx` deve subir** para o GitHub, pois é o coração do app.

> ⚠️ Se preferir **não** expor a sua tabela, adicione no `.gitignore` a linha:
> ```
> tabeladecompras.xlsx
> ```

---

## 4. Criar o README (você escreve!)

Este é o documento que aparece na capa do repositório. Edite o `README.md` que já
existe com o esqueleto pronto (preencha os espaços em branco):
- título e descrição do projeto
- lista de funcionalidades
- como rodar (comandos)
- estrutura de pastas
- captura de tela (salve em `docs/screenshot.png` por exemplo)

Para abrir o arquivo no editor:
```bash
# Exemplos (use o que você tem instalado):
gedit README.md
code README.md
nano README.md
```

---

## 5. Enviar os arquivos para o Git

```bash
git add -A
git status              # confira o que será enviado
git commit -m "feat: base do app Meu PC com listagem, CRUD e persistência em xlsx"
```

> Dica: use mensagens curtas e descritivas. Ex.:
> - `feat: add busca de peças`
> - `fix: corrige erro de porta em uso`
> - `docs: atualiza README`

---

## 6. Criar o repositório no GitHub

**Opção A — pela web (mais fácil):**
1. Abra `https://github.com/new`
2. Nome: `meu-pc` (ou outro)
3. Marque **Public** (ou Private)
4. **Não** marque "README / .gitignore / license" (já temos!)
5. Clique em criar e copie o link (ex.: `https://github.com/seu-usuario/meu-pc.git`)

**Opção B — pelo terminal (com `gh` CLI):**
```bash
gh auth login                          # entra no GitHub pelo terminal
gh repo create meu-pc --public --source=. --push
```

---

## 7. Conectar o remoto e enviar

```bash
# se usou Opção A, adicione o remoto com o link que copiou:
git remote add origin https://github.com/seu-usuario/meu-pc.git

# (ou, se usou SSH:)
# git remote add origin git@github.com:seu-usuario/meu-pc.git

git branch -M main
git push -u origin main
```

---

## 8. Conferir no GitHub

Abra `https://github.com/seu-usuario/meu-pc` e confira:
- [ ] README aparece na capa
- [ ] Arquivos e pastas listados
- [ ] ROADMAP.md e GUIA-GITHUB.md acessíveis

---

## 9. (Opcional) Publicar página do projeto — GitHub Pages

Se quiser um site com o app rodando:

1. Ative em *GitHub → Repositório → Settings → Pages*:
   - **Build and deployment**: *Deploy from a branch*
   - Branche: `main`, pasta `/docs`
2. Crie a pasta e coloque uma página simples lá:

```bash
mkdir -p meupc-app/docs
# crie meupc-app/docs/index.html com um link para o repositório
```

3. Os comandos para subir a alteração:
```bash
git add -A
git commit -m "docs: página inicial do projeto"
git push
```

> ⚠️ O app em si é um servidor Python (não roda direto no Pages).
> A página do *Pages* seria apenas uma **página de apresentação**.
> Para o app rodar de verdade na internet, veja a Sprint 5 (deploy em Render/Railway).

---

## 10. Atualizações futuras (fluxo diário)

```bash
git add -A
git commit -m "descrição curta da mudança"
git push
```

---

## 11. (Extras) Release e issues

Criar uma **release** (uma "versão" com etiqueta):
```bash
git tag -a v1.0.0 -m "Versão 1.0.0"
git push origin v1.0.0
```

Criar uma **issue** (tarefa/problema) pelo terminal:
```bash
gh issue create --title "Melhorar busca" --body "Ex.: filtrar por loja também"
```

---

> 🎯 **Resumo dos comandos principais:**
> ```bash
> git init -b main && git add -A && git commit -m "mensagem"    # preparar
> git remote add origin URL-do-repositorio                       # conectar
> git push -u origin main                                        # publicar
> git add -A && git commit -m "x" && git push                    # rotina
> ```