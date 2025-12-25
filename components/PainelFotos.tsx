import { useState, useRef } from 'react';

interface FotoState {
  src: string | null;
  file: File | null;
  texto: string;
}

export default function PainelFotos() {
  const [fotos, setFotos] = useState<FotoState[]>([
    { src: null, file: null, texto: '' },
    { src: null, file: null, texto: '' },
    { src: null, file: null, texto: '' },
    { src: null, file: null, texto: '' },
    { src: null, file: null, texto: '' },
    { src: null, file: null, texto: '' },
    { src: null, file: null, texto: '' },
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
        texto: newFotos[index].texto, // Manter texto existente
      };
      setFotos(newFotos);
      mostrarMensagem('Foto adicionada com sucesso!', 'ok');
    };
    // Ler como DataURL mantendo qualidade máxima
    reader.readAsDataURL(file);
  };

  const handleTextoChange = (index: number, texto: string) => {
    const newFotos = [...fotos];
    newFotos[index] = {
      ...newFotos[index],
      texto: texto,
    };
    setFotos(newFotos);
  };

  const handleRemoveFoto = (index: number) => {
    const newFotos = [...fotos];
    newFotos[index] = { src: null, file: null, texto: '' };
    setFotos(newFotos);
    if (fileInputsRef.current[index]) {
      fileInputsRef.current[index]!.value = '';
    }
  };

  const handleLimpar = () => {
    if (confirm('Deseja limpar todas as fotos?')) {
      setFotos(fotos.map(() => ({ src: null, file: null, texto: '' })));
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
    mostrarMensagem('Gerando PDF com qualidade máxima...', 'ok');

    try {
      // Carregar bibliotecas dinamicamente
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Ocultar botões de remover temporariamente
      const removeButtons = painelRef.current.querySelectorAll('.rm');
      removeButtons.forEach((btn) => {
        (btn as HTMLElement).style.display = 'none';
      });

      // Criar clone do painel SEM as fotos para capturar apenas o layout
      const painelElement = painelRef.current;
      const clone = painelElement.cloneNode(true) as HTMLElement;
      
      // Remover imagens das fotos do clone (manter apenas logo M12)
      const fotoImages = clone.querySelectorAll('.foto img');
      fotoImages.forEach((img) => {
        img.remove();
      });
      
      // Remover caixas de texto do clone (serão adicionadas depois no PDF)
      const fotoTextos = clone.querySelectorAll('.foto-texto');
      fotoTextos.forEach((texto) => {
        texto.remove();
      });
      
      // Remover bordas das fotos no clone (não aparecerão no PDF)
      const fotosNoClone = clone.querySelectorAll('.foto');
      fotosNoClone.forEach((foto: Element) => {
        (foto as HTMLElement).style.border = 'none';
        (foto as HTMLElement).style.borderRadius = '0';
      });
      
      // Configurar clone para captura em tamanho real A2
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.transform = 'scale(1)';
      clone.style.width = '594mm';
      clone.style.height = '420mm';
      clone.style.border = 'none'; // Remover borda do clone, vamos desenhar no PDF
      clone.style.overflow = 'visible';
      // Garantir que elementos filhos não sejam cortados
      const allChildren = clone.querySelectorAll('*');
      allChildren.forEach((el: Element) => {
        (el as HTMLElement).style.overflow = 'visible';
      });
      document.body.appendChild(clone);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Capturar apenas o layout (sem fotos) em alta qualidade
      // Adicionar windowWidth e windowHeight para evitar clipping
      const layoutCanvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#fff',
        width: clone.offsetWidth,
        height: clone.offsetHeight,
        allowTaint: true,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        x: 0,
        y: 0,
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

      // Desenhar borda amarela diretamente no PDF (6mm)
      pdf.setDrawColor(255, 244, 79); // #FFF44F
      pdf.setLineWidth(6);
      pdf.rect(0, 0, 594, 420, 'S'); // Desenhar retângulo como borda

      // Adicionar layout ao PDF (sem borda, pois já desenhamos)
      const layoutData = layoutCanvas.toDataURL('image/png', 1.0);
      pdf.addImage(layoutData, 'PNG', 0, 0, 594, 420, undefined, 'FAST');

      // Obter posições das fotos no painel (usando .foto-container para pegar todas as 7)
      const fotoContainers = painelElement.querySelectorAll('.foto-container');
      const fotoPositions: Array<{ x: number; y: number; width: number; height: number; src: string; texto: string }> = [];
      
      fotoContainers.forEach((container, index) => {
        const foto = container.querySelector('.foto');
        if (!foto) return;
        
        const rect = foto.getBoundingClientRect();
        const painelRect = painelElement.getBoundingClientRect();
        
        // Calcular posição do container (área disponível para foto + texto)
        const containerRect = container.getBoundingClientRect();
        const fotoRect = foto.getBoundingClientRect();
        
        // Calcular posição e tamanho do container (SEM bordas no PDF)
        const containerX = ((containerRect.left - painelRect.left) / painelRect.width) * 594;
        const containerY = ((containerRect.top - painelRect.top) / painelRect.height) * 420;
        const containerWidth = (containerRect.width / painelRect.width) * 594;
        const containerHeight = (containerRect.height / painelRect.height) * 420;
        
        // Área disponível para foto (sem espaço do texto)
        // Para foto central (index 3), usar mais espaço para texto
        const textoHeight = index === 3 ? 25 : 20; // foto central precisa de mais espaço
        const marginTopTexto = index === 3 ? 6 : 4; // mais espaçamento para foto central
        const fotoAreaWidth = containerWidth;
        const fotoAreaHeight = containerHeight - textoHeight - marginTopTexto;
        
        // Aumentar área da foto em 25% (usando toda a área disponível)
        const widthIncrease = fotoAreaWidth * 0.25;
        const heightIncrease = fotoAreaHeight * 0.25;
        const finalWidth = fotoAreaWidth + widthIncrease;
        const finalHeight = fotoAreaHeight + heightIncrease;
        
        // Centralizar a foto aumentada dentro da área disponível
        const xOffset = widthIncrease / 2;
        const yOffset = heightIncrease / 2;
        
        // Adicionar TODAS as fotos que têm imagem (garantir ordem correta)
        if (fotos[index]?.src) {
          fotoPositions.push({
            x: containerX - xOffset, // posição centralizada, sem bordas
            y: containerY - yOffset,
            width: finalWidth,
            height: finalHeight,
            src: fotos[index].src,
            texto: fotos[index].texto || '',
          });
        }
      });

      // Carregar e inserir cada foto ORIGINAL diretamente no PDF
      for (const foto of fotoPositions) {
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = foto.src;
          });

          // Criar canvas temporário para a foto em alta qualidade
          const fotoCanvas = document.createElement('canvas');
          const ctx = fotoCanvas.getContext('2d', { alpha: false });
          if (ctx) {
            // Aumentar DPI para melhor qualidade em fotos maiores (350 DPI)
            const maxDPI = 350;
            const mmToPx = maxDPI / 25.4;
            const canvasWidth = Math.round(foto.width * mmToPx);
            const canvasHeight = Math.round(foto.height * mmToPx);
            
            fotoCanvas.width = canvasWidth;
            fotoCanvas.height = canvasHeight;
            
            // Desenhar imagem mantendo proporção
            const imgAspect = img.width / img.height;
            const canvasAspect = canvasWidth / canvasHeight;
            
            let drawWidth = canvasWidth;
            let drawHeight = canvasHeight;
            let drawX = 0;
            let drawY = 0;
            
            if (imgAspect > canvasAspect) {
              drawHeight = canvasWidth / imgAspect;
              drawY = (canvasHeight - drawHeight) / 2;
            } else {
              drawWidth = canvasHeight * imgAspect;
              drawX = (canvasWidth - drawWidth) / 2;
            }
            
            ctx.fillStyle = '#f9f9f9';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            
            // Adicionar foto ao PDF em qualidade máxima
            const fotoData = fotoCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(fotoData, 'PNG', foto.x, foto.y, foto.width, foto.height, undefined, 'FAST');
            
            // Adicionar texto abaixo da foto se houver
            if (foto.texto && foto.texto.trim()) {
              pdf.setFontSize(14);
              pdf.setTextColor(0, 0, 0);
              // Mais espaçamento para foto central (index 3)
              const fotoIndex = fotoPositions.indexOf(foto);
              const spacing = fotoIndex === 3 ? 10 : 8; // 10mm para foto central, 8mm para outras
              const textY = foto.y + foto.height + spacing;
              const textX = foto.x + (foto.width / 2); // Centralizado
              
              // Quebrar texto em linhas se necessário
              const maxWidth = foto.width - 4;
              const lines = pdf.splitTextToSize(foto.texto, maxWidth);
              
              // Desenhar texto centralizado
              lines.forEach((line: string, lineIndex: number) => {
                const textWidth = pdf.getTextWidth(line);
                pdf.text(line, textX - (textWidth / 2), textY + (lineIndex * 6));
              });
            }
          }
        } catch (error) {
          console.warn(`Erro ao processar foto:`, error);
        }
      }

      // Salvar PDF
      pdf.save(`Painel_Filhos_de_Siao_${Date.now()}.pdf`);

      mostrarMensagem('PDF gerado com sucesso em qualidade máxima!', 'ok');
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
          border: 10px solid #FFF44F;
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
          background: #FFF44F;
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
          background: #FFD54F;
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
          border: 6mm solid #FFF44F;
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
          background: #FFF44F;
          padding: 15mm 120mm 15mm 120mm;
          text-align: center;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100mm;
          box-sizing: border-box;
        }

        .top-content {
          flex: 1;
          text-align: center;
          z-index: 2;
        }

        .logo-m12 {
          width: 80mm;
          height: 80mm;
          object-fit: contain;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }

        .logo-m12-esquerdo {
          left: 15mm;
        }

        .logo-m12-direito {
          right: 15mm;
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
          height: calc(420mm - 100mm);
          padding: 8mm 12mm;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 1fr 1.4fr 1fr;
          gap: 5mm;
          box-sizing: border-box;
          overflow: visible;
        }

        .foto-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: visible;
        }

        .foto {
          border: 4mm solid #ddd;
          border-radius: 8mm;
          background: #f9f9f9;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          width: 100%;
          flex: 1;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .foto-texto {
          width: 100%;
          margin-top: 4mm;
          padding: 3mm;
          border: 1mm solid #ddd;
          border-radius: 3mm;
          background: white;
          font-size: 16pt;
          font-family: Arial, sans-serif;
          text-align: center;
          resize: none;
          min-height: 16mm;
          max-height: 40mm;
          overflow-y: auto;
          word-wrap: break-word;
          flex-shrink: 0;
        }

        .foto-container.mid .foto-texto {
          margin-top: 6mm; /* Mais espaçamento para foto central */
        }

        .foto-texto:focus {
          outline: 2mm solid #FFF44F;
          border-color: #FFF44F;
        }

        .foto-container.mid {
          grid-column: 1 / 4;
        }

        .foto:hover {
          border-color: #FFF44F;
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
              <rect x="5" y="5" width="190" height="190" rx="15" fill="none" stroke="#FFF44F" strokeWidth="9"/>
              <rect x="14" y="14" width="172" height="172" rx="12" fill="none" stroke="#FFF44F" strokeWidth="7"/>
              <text x="100" y="70" fontFamily="Arial" fontSize="52" fontWeight="bold" fill="#FFF44F" textAnchor="middle">M12</text>
              <circle cx="100" cy="130" r="37" fill="none" stroke="#FFF44F" strokeWidth="5"/>
              <line x1="76" y1="130" x2="124" y2="130" stroke="#FFF44F" strokeWidth="4"/>
              <line x1="100" y1="106" x2="100" y2="154" stroke="#FFF44F" strokeWidth="4"/>
              <ellipse cx="100" cy="130" rx="37" ry="23" fill="none" stroke="#FFF44F" strokeWidth="3.5"/>
              <ellipse cx="100" cy="130" rx="23" ry="37" fill="none" stroke="#FFF44F" strokeWidth="3.5"/>
              <path d="M 23 174 Q 100 165 177 174" fill="none" stroke="#FFF44F" strokeWidth="7"/>
              <text x="100" y="192" fontFamily="Arial" fontSize="20" fontWeight="bold" fill="#FFF44F" textAnchor="middle">MT 28:19</text>
            </svg>
          </div>

          <div className="main">
            <div className="top">
              <img
                src="/m12.png"
                alt="M12"
                className="logo-m12 logo-m12-esquerdo"
              />
              <div className="top-content">
                <h1>FILHOS DE SIÃO</h1>
                <p>Quero trazer à memória o que me pode dar esperança Lamentações 3:21</p>
              </div>
              <img
                src="/m12.png"
                alt="M12"
                className="logo-m12 logo-m12-direito"
              />
            </div>

            <div className="grid">
              {fotos.map((foto, index) => (
                <div
                  key={index}
                  className={`foto-container ${index === 3 ? 'mid' : ''}`}
                  data-i={index}
                >
                  <div
                    className="foto"
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
                  <textarea
                    className="foto-texto"
                    placeholder={`Legenda para Foto ${index + 1}...`}
                    value={foto.texto}
                    onChange={(e) => handleTextoChange(index, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
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

