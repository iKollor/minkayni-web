/* LangMenu — el selector de idioma de la barra compacta (la que se ve al
   desplazarse y en móvil), hecho con el mismo MenuItem del megamenú para que
   sea exactamente el mismo desplegable que en la barra completa. Como en la
   barra compacta no hay hover en móvil, el ítem también abre al pulsarlo. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { HoveredLink, MenuItem } from './NavMenu';
import type { MenuLabels, MenuLanguage } from './menu-types';

interface Props {
  languages: MenuLanguage[];
  labels: MenuLabels;
}

export default function LangMenu({ languages, labels }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActive(null), 140);
  }, [cancelClose]);
  const activate = useCallback(
    (item: string | null) => {
      cancelClose();
      setActive(item);
    },
    [cancelClose]
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-nav-menu-panel]') && !target.closest('[data-lang-menu]')) setActive(null);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [active]);

  const current = languages.find(l => l.current);
  if (!current) return null;

  return (
    <nav data-lang-menu aria-label={labels.changeLanguage} onMouseEnter={cancelClose} onMouseLeave={scheduleClose} className="flex items-center text-[0.95rem] font-medium">
      <MenuItem setActive={activate} active={active} item={current.short} chevron onPanelEnter={cancelClose} onPanelLeave={scheduleClose}>
        <div className="flex min-w-[10.5rem] flex-col">
          <span className="px-3 pb-1 pt-1 text-[0.64rem] font-bold uppercase tracking-[0.22em] text-black/45">{labels.language}</span>
          {languages.map(lang => (
            <HoveredLink key={lang.code} {...lang} />
          ))}
        </div>
      </MenuItem>
    </nav>
  );
}
