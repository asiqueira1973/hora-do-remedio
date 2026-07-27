import { createContext, useContext, useRef, useState, type ReactNode } from 'react';

interface BannerEstado {
  remedioId: number;
  nome: string;
}

interface ArchiveBannerValue {
  banner: BannerEstado | null;
  mostrarBanner: (b: BannerEstado) => void;
  ocultarBanner: () => void;
}

const ArchiveBannerContext = createContext<ArchiveBannerValue>({
  banner: null,
  mostrarBanner: () => {},
  ocultarBanner: () => {},
});

const DURACAO_MS = 5000;

/**
 * Guarda o estado da faixa "{nome} foi arquivado / Desfazer" que aparece
 * na Home depois de "Parar de tomar" (8.3).
 *
 * Recebe: os componentes filhos.
 * Devolve: o provider do Context.
 *
 * Implementa o critério de aceite de 8.3: a faixa some sozinha depois de
 * 5 segundos (11.3) se ninguém tocar em "Desfazer". Fica num Context (não
 * dentro da própria tela de detalhe) porque a faixa é mostrada na Home,
 * depois da navegação de volta — as duas telas precisam do mesmo estado.
 */
export function ArchiveBannerProvider({ children }: { children: ReactNode }) {
  const [banner, setBanner] = useState<BannerEstado | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function mostrarBanner(b: BannerEstado) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setBanner(b);
    timeoutRef.current = setTimeout(() => setBanner(null), DURACAO_MS);
  }

  function ocultarBanner() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setBanner(null);
  }

  return <ArchiveBannerContext.Provider value={{ banner, mostrarBanner, ocultarBanner }}>{children}</ArchiveBannerContext.Provider>;
}

export function useArchiveBanner(): ArchiveBannerValue {
  return useContext(ArchiveBannerContext);
}
