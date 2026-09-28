import type {ReactNode} from 'react';
export function ContentContainer({width='standard',children}:{width?:'reading'|'standard'|'wide';children:ReactNode}){
 return <div className="ds-container" data-width={width}>{children}</div>;
}
