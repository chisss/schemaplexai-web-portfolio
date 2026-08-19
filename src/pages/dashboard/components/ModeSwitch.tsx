import { useTranslation } from 'react-i18next';
import { useHomepageStore } from '@/store/useHomepageStore';
import { useAppStore } from '@/store/useAppStore';
import type { HomepageMode } from '@/types/homepage';

const MODES: { key: HomepageMode; labelKey: string }[] = [
  { key: 'tasks', labelKey: 'controlTower.modeTasks' },
  { key: 'ai', labelKey: 'controlTower.modeAI' },
  { key: 'situation', labelKey: 'controlTower.modeSituation' },
];

export default function ModeSwitch() {
  const { t } = useTranslation();
  const mode = useHomepageStore((s) => s.mode);
  const setMode = useHomepageStore((s) => s.setMode);
  const isDark = useAppStore((s) => s.theme === 'dark');

  return (
    <div
      role="tablist"
      aria-label={t('controlTower.modeSwitch')}
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 3,
        borderRadius: 10,
        background: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(241,245,249,0.9)',
      }}
    >
      {MODES.map(({ key, labelKey }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => setMode(key)}
            onKeyDown={(e) => {
              const idx = MODES.findIndex((m) => m.key === key);
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                setMode(MODES[(idx + 1) % MODES.length].key);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setMode(MODES[(idx - 1 + MODES.length) % MODES.length].key);
              }
            }}
            style={{
              padding: '5px 14px',
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: active
                ? isDark ? 'rgba(59,130,246,0.2)' : '#fff'
                : 'transparent',
              color: active
                ? isDark ? '#93c5fd' : 'var(--color-primary, #165dff)'
                : isDark ? '#94a3b8' : '#64748b',
              boxShadow: active && !isDark ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
