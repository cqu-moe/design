import type {ReactNode} from 'react';
export function PageHeader({title,description,actions}:{title:string;description?:string;actions?:ReactNode}){
 return <header className="ds-page-header"><div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="ds-page-actions">{actions}</div>}</header>;
}
