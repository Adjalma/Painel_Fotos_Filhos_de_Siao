import { useState, useRef } from 'react';

interface FotoState {
  src: string | null;
  file: File | null;
}

export default function PainelFotos() {
  const [fotos, setFotos] = useState<FotoState[]>([
    { src: null, file: null },
    { src: null, file: null },
    { src: null, file: null },
    { src: null, file: null },
    { src: null, file: null },
    { src: null, file: null },
    { src: null, file: null },
  ]);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'ok' | 'err' } | null>(null);
  const [gerando, setGerando] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);
  const fileInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const mostrarMensagem = (texto: string, tipo: 'ok' | 'err') => {
    setMensagem({ texto, tipo });
    if (tipo === 'ok') {
      setTimeout(() => setMensagem(null), 4000);
    }
  };

  const handleFileSelect = (index: number, file: File | null) => {
    if (!file) return;

    // Usar FileReader para ler a imagem SEM processar - manter qualidade original
    const reader = new FileReader();
    reader.onload = (e) => {
      const newFotos = [...fotos];
      newFotos[index] = {
        src: e.target?.result as string, // Usar imagem original diretamente
        file: file,
      };
      setFotos(newFotos);
      mostrarMensagem('Foto adicionada com sucesso!', 'ok');
    };
    // Ler como DataURL mantendo qualidade máxima
    reader.readAsDataURL(file);
  };

  const handleRemoveFoto = (index: number) => {
    const newFotos = [...fotos];
    newFotos[index] = { src: null, file: null };
    setFotos(newFotos);
    if (fileInputsRef.current[index]) {
      fileInputsRef.current[index]!.value = '';
    }
  };

  const handleLimpar = () => {
    if (confirm('Deseja limpar todas as fotos?')) {
      setFotos(fotos.map(() => ({ src: null, file: null })));
      fileInputsRef.current.forEach((input) => {
        if (input) input.value = '';
      });
    }
  };

  const handleGerarPDF = async () => {
    if (!painelRef.current) return;

    // Verificar se há pelo menos uma foto
    const temFotos = fotos.some((f) => f.src !== null);
    if (!temFotos) {
      mostrarMensagem('Adicione pelo menos uma foto antes de gerar o PDF', 'err');
      return;
    }

    setGerando(true);
    mostrarMensagem('Gerando PDF...', 'ok');

    try {
      // Carregar html2canvas e jspdf dinamicamente
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Ocultar botões de remover temporariamente
      const removeButtons = painelRef.current.querySelectorAll('.rm');
      removeButtons.forEach((btn) => {
        (btn as HTMLElement).style.display = 'none';
      });

      // Criar clone do painel em tamanho real para captura
      const painelElement = painelRef.current;
      const clone = painelElement.cloneNode(true) as HTMLElement;
      
      // Configurar clone para captura em tamanho real A2
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.transform = 'scale(1)';
      clone.style.width = '594mm';
      clone.style.height = '420mm';
      clone.style.border = '6mm solid #FFFF00';
      document.body.appendChild(clone);

      // Garantir que todas as imagens estejam carregadas
      const images = clone.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img) => {
        const imgEl = img as HTMLImageElement;
        if (imgEl.complete && imgEl.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          imgEl.onload = resolve;
          imgEl.onerror = resolve;
          // Timeout de segurança
          setTimeout(resolve, 5000);
        });
      });
      
      await Promise.all(imagePromises);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Capturar o clone em tamanho real A2 com MÁXIMA qualidade
      const canvas = await html2canvas(clone, {
        scale: 4,
        useCORS: true,
        logging: false,
        backgroundColor: '#fff',
        width: clone.offsetWidth,
        height: clone.offsetHeight,
        allowTaint: true,
        removeContainer: false,
        imageTimeout: 20000,
        onclone: (clonedDoc) => {
          // Garantir que imagens no clone mantenham qualidade
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach((img) => {
            const imgEl = img as HTMLImageElement;
            imgEl.style.imageRendering = 'auto';
            imgEl.style.maxWidth = 'none';
            imgEl.style.maxHeight = 'none';
          });
        },
      });

      // Remover clone
      document.body.removeChild(clone);

      // Criar PDF A2 em paisagem (594mm x 420mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a2',
        compress: false,
      });

      // Calcular dimensões exatas do canvas em mm
      const canvasWidthMM = (canvas.width / 4) * 0.264583; // converter pixels para mm (scale 4)
      const canvasHeightMM = (canvas.height / 4) * 0.264583;
      
      // Usar qualidade máxima no PNG para melhor qualidade
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Adicionar imagem ao PDF preenchendo TODO o espaço A2 (594mm x 420mm)
      pdf.addImage(imgData, 'PNG', 0, 0, 594, 420, undefined, 'FAST');

      // Salvar PDF
      pdf.save(`Painel_Filhos_de_Siao_${Date.now()}.pdf`);

      mostrarMensagem('PDF gerado com sucesso!', 'ok');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      mostrarMensagem('Erro ao gerar PDF. Tente novamente.', 'err');
    } finally {
      setGerando(false);
      // Restaurar botões de remover
      const removeButtons = painelRef.current?.querySelectorAll('.rm');
      removeButtons?.forEach((btn) => {
        (btn as HTMLElement).style.display = '';
      });
    }
  };

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background: #2c3e50;
          border: 10px solid #FFFF00;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .controls {
          max-width: 1400px;
          margin: 0 auto 20px;
          background: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }

        .btn {
          background: #FFFF00;
          color: #000;
          border: none;
          padding: 15px 30px;
          font-size: 16px;
          font-weight: bold;
          border-radius: 5px;
          cursor: pointer;
          margin: 5px;
          transition: background 0.3s;
        }

        .btn:hover:not(:disabled) {
          background: #e6e600;
        }

        .btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
        }

        .wrap {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: auto;
          padding: 20px;
          max-height: calc(100vh - 200px);
        }

        #painel {
          width: 594mm;
          height: 420mm;
          min-width: 594mm;
          min-height: 420mm;
          max-width: 594mm;
          max-height: 420mm;
          background: white;
          position: relative;
          border: 6mm solid #FFFF00;
          box-sizing: border-box;
          transform: scale(0.85);
          transform-origin: top center;
          flex-shrink: 0;
        }

        @media (max-width: 1920px) {
          #painel {
            transform: scale(0.75);
          }
        }

        @media (max-width: 1366px) {
          #painel {
            transform: scale(0.65);
          }
        }

        .bg {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .wm1 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 80pt;
          font-weight: 900;
          color: rgba(200, 200, 200, 0.15);
          font-family: Arial Black;
        }

        .wm2 {
          position: absolute;
          bottom: 15mm;
          left: 90mm;
          font-size: 18pt;
          font-weight: bold;
          color: rgba(100, 100, 100, 0.4);
        }

        .wm3 {
          position: absolute;
          bottom: 15mm;
          right: 30mm;
          font-size: 18pt;
          font-weight: bold;
          color: rgba(100, 100, 100, 0.4);
        }

        .logo {
          position: absolute;
          bottom: 12mm;
          left: 12mm;
          width: 70mm;
          height: 70mm;
          opacity: 0.25;
        }

        .main {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
        }

        .top {
          background: #FFFF00;
          padding: 20mm 150mm 20mm 150mm;
          text-align: center;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 130mm;
          box-sizing: border-box;
        }

        .top-content {
          flex: 1;
          text-align: center;
          z-index: 2;
        }

        .escudo {
          width: 70mm;
          height: 70mm;
          object-fit: contain;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }

        .escudo-esquerdo {
          left: 12mm;
        }

        .escudo-direito {
          right: 12mm;
        }

        .top h1 {
          font-size: 48pt;
          margin: 0 0 10mm 0;
          font-weight: 900;
        }

        .top p {
          font-size: 28pt;
          font-style: italic;
          line-height: 1.3;
          font-weight: bold;
          margin: 0;
          padding: 0 20mm;
        }

        .grid {
          height: calc(420mm - 130mm);
          padding: 24mm 30mm;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 1fr 1.5fr 1fr;
          gap: 15mm;
          box-sizing: border-box;
          overflow: hidden;
        }

        .foto {
          border: 6mm solid #ddd;
          border-radius: 12mm;
          background: #f9f9f9;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .foto.mid {
          grid-column: 1 / 4;
        }

        .foto:hover {
          border-color: #FFFF00;
        }

        .foto img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          display: block;
          image-rendering: auto;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        .ph {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #aaa;
          font-size: 32pt;
          font-weight: bold;
        }

        .ph svg {
          width: 120mm;
          height: 120mm;
          margin-bottom: 15mm;
          opacity: 0.4;
        }

        .rm {
          position: absolute;
          top: 15mm;
          right: 15mm;
          width: 60mm;
          height: 60mm;
          background: rgba(220, 53, 69, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 48pt;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 20;
        }

        .foto:hover .rm {
          display: flex;
        }

        input[type="file"] {
          display: none;
        }

        .msg {
          margin-top: 10px;
          padding: 10px;
          border-radius: 4px;
          display: none;
        }

        .msg.show {
          display: block;
        }

        .msg.ok {
          background: #d4edda;
          color: #155724;
        }

        .msg.err {
          background: #f8d7da;
          color: #721c24;
        }

        @media print {
          .controls {
            display: none;
          }
        }
      `}</style>

      <div className="controls">
        <h2>Painel Fotográfico - Filhos de Sião</h2>
        <button
          className="btn"
          id="btn"
          onClick={handleGerarPDF}
          disabled={gerando}
        >
          {gerando ? 'GERANDO PDF...' : 'GERAR PDF A2'}
        </button>
        <button className="btn btn-secondary" id="clr" onClick={handleLimpar}>
          LIMPAR
        </button>
        {mensagem && (
          <div id="msg" className={`msg ${mensagem.tipo} show`}>
            {mensagem.texto}
          </div>
        )}
      </div>

      <div className="wrap">
        <div id="painel" ref={painelRef}>
          <div className="bg">
            <div className="wm1">Filhos de Sião</div>
            <div className="wm2">Filhos de Sião</div>
            <div className="wm3">MIR Macaé</div>
            <svg className="logo" viewBox="0 0 200 200">
              <rect x="5" y="5" width="190" height="190" rx="15" fill="none" stroke="#FFFF00" strokeWidth="9"/>
              <rect x="14" y="14" width="172" height="172" rx="12" fill="none" stroke="#FFFF00" strokeWidth="7"/>
              <text x="100" y="70" fontFamily="Arial" fontSize="52" fontWeight="bold" fill="#FFFF00" textAnchor="middle">M12</text>
              <circle cx="100" cy="130" r="37" fill="none" stroke="#FFFF00" strokeWidth="5"/>
              <line x1="76" y1="130" x2="124" y2="130" stroke="#FFFF00" strokeWidth="4"/>
              <line x1="100" y1="106" x2="100" y2="154" stroke="#FFFF00" strokeWidth="4"/>
              <ellipse cx="100" cy="130" rx="37" ry="23" fill="none" stroke="#FFFF00" strokeWidth="3.5"/>
              <ellipse cx="100" cy="130" rx="23" ry="37" fill="none" stroke="#FFFF00" strokeWidth="3.5"/>
              <path d="M 23 174 Q 100 165 177 174" fill="none" stroke="#FFFF00" strokeWidth="7"/>
              <text x="100" y="192" fontFamily="Arial" fontSize="20" fontWeight="bold" fill="#FFFF00" textAnchor="middle">MT 28:19</text>
            </svg>
          </div>

          <div className="main">
            <div className="top">
              <img
                src="/escudos/escudo-esquerdo.jpeg"
                alt="Escudo Esquerdo"
                className="escudo escudo-esquerdo"
              />
              <div className="top-content">
                <h1>FILHOS DE SIÃO</h1>
                <p>Quero trazer à memória o que me pode dar esperança — Lamentações 3:21</p>
              </div>
              <img
                src="/escudos/escudo-direito.jpeg"
                alt="Escudo Direito"
                className="escudo escudo-direito"
              />
            </div>

            <div className="grid">
              {fotos.map((foto, index) => (
                <div
                  key={index}
                  className={`foto ${index === 3 ? 'mid' : ''}`}
                  data-i={index}
                  onClick={() => fileInputsRef.current[index]?.click()}
                >
                  {foto.src ? (
                    <img src={foto.src} alt={`Foto ${index + 1}`} />
                  ) : (
                    <div className="ph">
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                      {index === 3 ? 'Foto 4 - DESTAQUE' : `Foto ${index + 1}`}
                    </div>
                  )}
                  <button
                    className="rm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFoto(index);
                    }}
                  >
                    ×
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => {
                      fileInputsRef.current[index] = el;
                    }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleFileSelect(index, file);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

