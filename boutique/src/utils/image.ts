/**
 * Image Utils - Compression, resize, conversion base64
 * Optimise les photos avant stockage IndexedDB
 */

/**
 * Options de compression
 */
interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  mimeType?: string;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  mimeType: 'image/jpeg'
};

/**
 * Compresse une image pour réduire sa taille
 * @param file Fichier image original
 * @param options Options de compression
 * @returns Blob compressé
 */
export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calcule les nouvelles dimensions (garde le ratio)
        let { width, height } = img;
        
        if (width > opts.maxWidth) {
          height = (height * opts.maxWidth) / width;
          width = opts.maxWidth;
        }
        
        if (height > opts.maxHeight) {
          width = (width * opts.maxHeight) / height;
          height = opts.maxHeight;
        }

        // Crée le canvas pour redimensionner
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // Dessine l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Convertit en blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          opts.mimeType,
          opts.quality
        );
      };

      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convertit un Blob en base64 data URL
 * @param blob Blob à convertir
 * @returns Promise<string> data URL (data:image/jpeg;base64,...)
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convertit une base64 data URL en Blob
 * @param dataUrl Data URL (data:image/jpeg;base64,...)
 * @returns Blob
 */
export function base64ToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Crée un thumbnail (miniature) pour preview
 * @param file Fichier image
 * @returns Promise<string> data URL du thumbnail
 */
export async function createThumbnail(file: File | Blob): Promise<string> {
  const compressed = await compressImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.7
  });
  
  return blobToBase64(compressed);
}

/**
 * Valide qu'un fichier est une image
 * @param file Fichier à vérifier
 * @returns true si c'est une image valide
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Récupère les dimensions d'une image
 * @param file Fichier image
 * @returns Promise<{width, height}>
 */
export async function getImageDimensions(
  file: File | Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Formate la taille d'un fichier pour affichage
 * @param bytes Taille en octets
 * @returns Chaîne formatée (ex: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}