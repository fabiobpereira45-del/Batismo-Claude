/**
 * Utilitário para compressão e redimensionamento de imagens no cliente (navegador).
 * Reduz fotos de câmeras/celulares (que costumam ter 5MB-15MB) para ~50KB-150KB,
 * economizando cota de armazenamento e tráfego de saída (Egress) do Supabase.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0 (padrão 0.8)
  mimeType?: string; // 'image/jpeg' ou 'image/webp'
}

export interface CompressionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export async function compressImage(
  source: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    mimeType = "image/jpeg",
  } = options;

  const originalSize = source.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo de imagem."));
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error("Erro ao carregar a imagem para processamento."));
      
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calcular proporção mantendo o aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível criar o contexto 2D para compressão."));
          return;
        }

        // Configurar renderização de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Preencher fundo branco (evita transparência preta em PNGs convertidos para JPEG)
        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Falha ao gerar o blob da imagem comprimida."));
              return;
            }

            // Preservar o nome original com extensão correta
            let fileName = "foto.jpg";
            if (source instanceof File && source.name) {
              const nameWithoutExt = source.name.substring(0, source.name.lastIndexOf('.')) || source.name;
              fileName = `${nameWithoutExt}.jpg`;
            } else {
              fileName = `foto-${Date.now()}.jpg`;
            }

            const compressedFile = new File([blob], fileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              blob,
              dataUrl,
              originalSize,
              compressedSize: blob.size,
              width,
              height,
            });
          },
          mimeType,
          quality
        );
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(source);
  });
}
