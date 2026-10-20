import { Intro, ProductSample, type LandingProps } from './content';

export function Editorial(props: LandingProps) {
  return (
    <section className="hero hero-manual">
      <Intro {...props} />
      <div className="manual-content">
        <p className="manual-brief">{props.product.requirement}</p>
        <ProductSample id={props.id} />
        <a className="text-link" href="#install">
          接下来：安装 {props.product.name} ↓
        </a>
      </div>
    </section>
  );
}
