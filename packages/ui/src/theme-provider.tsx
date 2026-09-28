import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { applyTheme, readPreference, resolveTheme, THEME_KEY, type ThemePreference, type ResolvedTheme } from '@cqu-moe/theme';
type ThemeContextValue = { preference: ThemePreference; resolvedTheme: ResolvedTheme; setPreference(value: ThemePreference): void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
export function ThemeProvider({children}:{children:ReactNode}) {
 const [preference,setValue] = useState<ThemePreference>(readPreference);
 const [systemDark,setSystemDark] = useState(()=>matchMedia('(prefers-color-scheme: dark)').matches);
 const resolvedTheme=resolveTheme(preference,systemDark);
 useLayoutEffect(()=>{
  const root=document.documentElement; root.dataset.themeSwitching='true'; applyTheme(resolvedTheme);
  const id=requestAnimationFrame(()=>{ delete root.dataset.themeSwitching; });
  return ()=>cancelAnimationFrame(id);
 },[resolvedTheme]);
 useEffect(()=>{
  const media=matchMedia('(prefers-color-scheme: dark)'); const sync=()=>setSystemDark(media.matches);
  const storage=(event:StorageEvent)=>{if(event.key===THEME_KEY || event.key===null)setValue(readPreference());};
  const keyboard=(event:KeyboardEvent)=>{if(!event.metaKey&&!event.ctrlKey&&!event.altKey)document.documentElement.dataset.input='keyboard';};
  const pointer=()=>{document.documentElement.dataset.input='pointer';};
  media.addEventListener('change',sync); window.addEventListener('storage',storage);
  window.addEventListener('keydown',keyboard,true); window.addEventListener('pointerdown',pointer,true);
  return ()=>{media.removeEventListener('change',sync);window.removeEventListener('storage',storage);window.removeEventListener('keydown',keyboard,true);window.removeEventListener('pointerdown',pointer,true);};
 },[]);
 function setPreference(value:ThemePreference){setValue(value);try{localStorage.setItem(THEME_KEY,value);}catch{/* Keep the preference for this page when storage is unavailable. */}}
 return <ThemeContext.Provider value={{preference,resolvedTheme,setPreference}}>{children}</ThemeContext.Provider>;
}
export function useTheme(){const context=useContext(ThemeContext);if(!context)throw new Error('useTheme requires ThemeProvider');return context;}
