# Painel Fotográfico - Filhos de Sião

Aplicação web para criação de painéis fotográficos em formato PDF A3 com destaque para os escudos e cores amarelas.

## Características

- ✅ Upload de até 7 fotos (6 pequenas + 1 destaque central)
- ✅ Integração de escudos na parte amarela superior (esquerdo e direito)
- ✅ Geração de PDF A3 em paisagem (420mm x 297mm)
- ✅ Interface moderna e responsiva
- ✅ Design com destaque para cores amarelas conforme especificação

## Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **html2canvas** - Captura do painel como imagem
- **jsPDF** - Geração de PDF
- **Vercel** - Deploy e hospedagem

## Estrutura do Projeto

```
├── components/
│   └── PainelFotos.tsx    # Componente principal do painel
├── pages/
│   ├── index.tsx          # Página principal
│   └── api/               # API routes (se necessário)
├── public/
│   ├── escudos/           # Imagens dos escudos
│   └── uploads/           # Uploads temporários
├── next.config.js         # Configuração Next.js
├── vercel.json            # Configuração Vercel
└── package.json           # Dependências
```

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Adjalma/Painel_Fotos_Filhos_de_Siao.git
cd Painel_Fotos_Filhos_de_Siao
```

2. Instale as dependências:
```bash
npm install
```

3. Execute em modo desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador:
```
http://localhost:3000
```

## Uso

1. Clique em qualquer slot de foto para adicionar uma imagem
2. A foto central (Foto 4) é destacada e ocupa mais espaço
3. Clique no botão "GERAR PDF A3" para gerar o PDF
4. Use "LIMPAR" para remover todas as fotos

## Deploy no Vercel

1. Faça push do código para o GitHub
2. Conecte o repositório no Vercel
3. O Vercel detectará automaticamente o Next.js
4. O deploy será feito automaticamente

Ou use a CLI do Vercel:
```bash
npm i -g vercel
vercel
```

## Formato do PDF

- **Tamanho**: A3 (420mm x 297mm)
- **Orientação**: Paisagem
- **Resolução**: Alta qualidade (scale: 2)
- **Formato**: JPEG com qualidade 95%

## Estrutura do Painel

- **Parte Superior (Amarela)**: Título "FILHOS DE SIÃO" com escudos nas laterais
- **Grid de Fotos**: 
  - 3 fotos na primeira linha
  - 1 foto central destacada (maior)
  - 3 fotos na última linha

## Licença

Este projeto é privado e de uso interno.

## Autor

Desenvolvido para Filhos de Sião - MIR Macaé

