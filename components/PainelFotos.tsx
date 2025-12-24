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

    const reader = new FileReader();
    reader.onload = (e) => {
      const newFotos = [...fotos];
      newFotos[index] = {
        src: e.target?.result as string,
        file: file,
      };
      setFotos(newFotos);
      mostrarMensagem('Foto adicionada com sucesso!', 'ok');
    };
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

      // Remover scale temporariamente para captura em tamanho real
      const painelElement = painelRef.current;
      const originalTransform = painelElement.style.transform;
      const originalPosition = painelElement.style.position;
      const originalLeft = painelElement.style.left;
      
      // Aplicar tamanho real para captura
      painelElement.style.transform = 'scale(1)';
      painelElement.style.position = 'fixed';
      painelElement.style.left = '0';
      painelElement.style.top = '0';
      painelElement.style.width = '420mm';
      painelElement.style.height = '297mm';

      await new Promise((resolve) => setTimeout(resolve, 600));

      // Capturar o painel como canvas em tamanho real A3 com alta qualidade
      const canvas = await html2canvas(painelElement, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#fff',
        width: 420 * 3.779527559, // 420mm em pixels
        height: 297 * 3.779527559, // 297mm em pixels
        windowWidth: 420 * 3.779527559,
        windowHeight: 297 * 3.779527559,
      });

      // Restaurar transformação original
      painelElement.style.transform = originalTransform;
      painelElement.style.position = originalPosition;
      painelElement.style.left = originalLeft;
      painelElement.style.width = '';
      painelElement.style.height = '';
      painelElement.style.top = '';

      // Criar PDF A3 em paisagem (420mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Adicionar imagem ao PDF preenchendo todo o A3
      pdf.addImage(imgData, 'JPEG', 0, 0, 420, 297);

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
          overflow: auto;
          padding: 20px;
        }

        #painel {
          width: 420mm;
          height: 297mm;
          background: white;
          position: relative;
          border: 8mm solid #FFFF00;
          box-sizing: border-box;
          transform: scale(0.4);
          transform-origin: top center;
        }

        @media (max-width: 1920px) {
          #painel {
            transform: scale(0.35);
          }
        }

        @media (max-width: 1366px) {
          #painel {
            transform: scale(0.3);
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
          padding: 15mm 100mm 15mm 100mm;
          text-align: center;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .top-content {
          flex: 1;
          text-align: center;
          z-index: 2;
        }

        .escudo {
          width: 45mm;
          height: 45mm;
          object-fit: contain;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }

        .escudo-esquerdo {
          left: 10mm;
        }

        .escudo-direito {
          right: 10mm;
        }

        .top h1 {
          font-size: 26pt;
          margin: 0 0 5mm 0;
          font-weight: 900;
        }

        .top p {
          font-size: 13pt;
          font-style: italic;
          line-height: 1.2;
          font-weight: bold;
          margin: 0;
          padding: 0 10mm;
        }

        .grid {
          flex: 1;
          padding: 12mm 15mm;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 1fr 1.3fr 1fr;
          gap: 8mm;
        }

        .foto {
          border: 2mm solid #ddd;
          border-radius: 4mm;
          background: #f9f9f9;
          position: relative;
          cursor: pointer;
          overflow: hidden;
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
        }

        .ph {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #aaa;
          font-size: 14pt;
          font-weight: bold;
        }

        .ph svg {
          width: 40mm;
          height: 40mm;
          margin-bottom: 5mm;
          opacity: 0.4;
        }

        .rm {
          position: absolute;
          top: 5mm;
          right: 5mm;
          width: 20mm;
          height: 20mm;
          background: rgba(220, 53, 69, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 16pt;
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
          {gerando ? 'GERANDO PDF...' : 'GERAR PDF A3'}
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
                <p>&quot;Portanto ide, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo&quot; — Mateus 28:19</p>
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

