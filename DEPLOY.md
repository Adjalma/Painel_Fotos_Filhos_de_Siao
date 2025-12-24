# Guia de Deploy

## Conectar ao GitHub

1. Adicione o remote do GitHub:
```bash
git remote add origin https://github.com/Adjalma/Painel_Fotos_Filhos_de_Siao.git
```

2. Faça o push do código:
```bash
git push -u origin main
```

Se o repositório já existir e tiver conteúdo, use:
```bash
git push -u origin main --force
```

## Deploy no Vercel

### Opção 1: Via Interface Web (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "Add New Project"
4. Importe o repositório `Adjalma/Painel_Fotos_Filhos_de_Siao`
5. O Vercel detectará automaticamente o Next.js
6. Clique em "Deploy"
7. Aguarde o deploy ser concluído

### Opção 2: Via CLI

1. Instale a CLI do Vercel:
```bash
npm i -g vercel
```

2. No diretório do projeto, execute:
```bash
vercel
```

3. Siga as instruções no terminal
4. Para produção:
```bash
vercel --prod
```

## Configurações do Vercel

O projeto já está configurado com `vercel.json`:
- Timeout de 30 segundos para API routes
- Build automático do Next.js

## Variáveis de Ambiente

Nenhuma variável de ambiente é necessária para este projeto.

## Verificação Pós-Deploy

Após o deploy, verifique:
- ✅ A página carrega corretamente
- ✅ Os escudos aparecem na parte amarela
- ✅ É possível adicionar fotos
- ✅ A geração de PDF funciona

## Atualizações Futuras

Para atualizar o projeto:
1. Faça as alterações no código
2. Commit e push:
```bash
git add .
git commit -m "Descrição das alterações"
git push
```
3. O Vercel fará deploy automático (se configurado)

