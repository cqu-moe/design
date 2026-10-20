import { Intro, ProductSample, type LandingProps } from './content';

export function ColorField(props: LandingProps) {
  return (
    <section className="hero hero-split">
      <Intro {...props} />
      <ProductSample id={props.id} />
    </section>
  );
}
