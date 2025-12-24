import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Importar html2canvas e jspdf apenas no cliente
const PainelFotos = dynamic(() => import('../components/PainelFotos'), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Painel Fotográfico - Filhos de Sião</title>
        <meta name="description" content="Painel Fotográfico - Filhos de Sião - Geração de PDF A3" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <PainelFotos />
      </main>
    </>
  );
}

