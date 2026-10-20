import { Intro, ProductSample, type LandingProps } from './content';

export function Symbol(props: LandingProps) {
  return (
    <section className="hero hero-demo">
      <Intro {...props} />
      <ProductSample id={props.id} />
    </section>
  );
}
