import { Container } from "./container";
import { Breadcrumb } from "./breadcrumb";

export function PageBanner({
  title,
  subtitle,
  crumb,
}: {
  title: string;
  subtitle?: string;
  crumb: string;
}) {
  return (
    <div className="border-b border-line bg-cream-card">
      <Container className="py-5 text-center">
        <div className="flex justify-center">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: crumb }]} />
        </div>
        <h1 className="mt-2 font-serif text-2xl font-bold text-espresso sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted">{subtitle}</p>
        )}
      </Container>
    </div>
  );
}
