import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function UnauthorizedPage() {
  return (
    <section className="container-page py-24 text-center">
      <h1 className="text-3xl font-semibold">Unauthorized</h1>
      <p className="mt-2 text-muted-foreground">This area is not available for your role.</p>
      <Button asChild className="mt-6"><Link to="/">Go home</Link></Button>
    </section>
  );
}
